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
                    sh "docker stop ${CONTAINER_NAME} || true"
                    sh "docker rm ${CONTAINER_NAME} || true"
                    sh "docker run -d --name ${CONTAINER_NAME} -p 3000:80 ${DOCKER_IMAGE}:latest"
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
            echo "Successfully deployed! Site should be live at your EC2 IP."
        }
        failure {
            echo "Deployment failed. Check the Docker build logs above."
        }
    }
}
