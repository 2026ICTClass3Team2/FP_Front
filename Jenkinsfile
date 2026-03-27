pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "education-frontend"
        CONTAINER_NAME = "frontend-prod"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build the image using the Dockerfile we just made
                    sh "docker build -t ${DOCKER_IMAGE}:latest ."
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // 1. Stop and remove the old container if it exists
                    sh "docker stop ${CONTAINER_NAME} || true"
                    sh "docker rm ${CONTAINER_NAME} || true"
                    
                    // 2. Run the new container on Port 3000 
                    // (Nginx on the EC2 host will point to this port)
                    sh "docker run -d --name ${CONTAINER_NAME} -p 3000:80 ${DOCKER_IMAGE}:latest"
                }
            }
        }
    }
}
