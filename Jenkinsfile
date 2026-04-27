pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "education-frontend"
        CONTAINER_NAME = "frontend-prod"
    }

    stages {
        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:latest ."
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_PRIVATE_IP', variable: 'AWS_PRIVATE_IP')
                ]) {
                    script {
                        echo "1. Stopping old container..."
                        sh "docker stop ${CONTAINER_NAME} || true"
                        sh "docker rm ${CONTAINER_NAME} || true"
                        
                        echo "2. Booting new container..."
                        sh """
                        docker run -d \\
                          --name ${CONTAINER_NAME} \\
                          -p 3000:80 \\
                          -e AWS_PRIVATE_IP="${AWS_PRIVATE_IP}" \\
                          ${DOCKER_IMAGE}:latest
                        """

                        echo "3. Waiting for Frontend (Nginx) to fully start..."
                        
                        // Using \\\$ so Jenkins ignores the bash variables and passes them safely to Linux
                        sh """
                        for i in {1..12}; do
                            STATUS_CODE=\\\$(curl -o /dev/null -s -w "%{http_code}\\n" http://localhost:3000 || true)
                            
                            if [ "\\\$STATUS_CODE" = "200" ]; then
                                echo "✅ Frontend Nginx is UP and serving pages!"
                                exit 0
                            fi
                            
                            echo "⏳ Attempt \\\$i: Nginx returned status \\\$STATUS_CODE... waiting 5 seconds."
                            sleep 5
                        done
                        
                        echo "❌ ERROR: Frontend failed to start or serve the homepage within 60 seconds!"
                        docker logs ${CONTAINER_NAME} --tail 50
                        exit 1 
                        """
                    }
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh "docker image prune -f"
            }
        }
    }

    post {
        success {
            echo "🟢 Successfully deployed! Site is live and verified healthy."
        }
        failure {
            echo "🔴 Deployment failed. Check the Docker logs above."
        }
    }
}