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
                script {
                    echo "1. Stopping old container..."
                    sh "docker stop ${CONTAINER_NAME} || true"
                    sh "docker rm ${CONTAINER_NAME} || true"
                    
                    echo "2. Booting new container..."
                    sh """
                    docker run -d \\
                      --name ${CONTAINER_NAME} \\
                      -p 3000:80 \\
                      ${DOCKER_IMAGE}:latest
                    """

                    echo "3. Waiting for Frontend (Nginx) to fully start..."
                    sh '''
                        sleep 3
                        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://172.17.0.1:3000 || true)
                        if [ "$STATUS" = "200" ]; then
                            echo "✅ Nginx is UP and serving React!"
                        else
                            echo "❌ Frontend failed to start. HTTP Status: $STATUS"
                            exit 1
                        fi
                    '''
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