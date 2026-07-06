def buildTag = ''

def buildDockerImage(tag) {
    withCredentials([usernamePassword(credentialsId: 'docker-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
        sh """
            docker build -t sampleapp:${tag} .
            echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin
            docker tag sampleapp:${tag} ${DOCKER_USER}/sampleapp:${tag}
            docker push ${DOCKER_USER}/sampleapp:${tag}
        """
    }
}

pipeline {
    agent { label 'build-agent' }

    stages {
        stage('Generate Tag') {
            steps {
                script {
                    def date = new Date().format('yyyyMMdd')
                    buildTag = "${date}.${env.BUILD_NUMBER}"
                    currentBuild.displayName = buildTag
                }
            }
        }

        stage('Use Tag') {
            steps {
                script {
                    echo "The build tag is: ${buildTag}"
                }
            }
        }

        stage('Checkout Code') {
            steps {
                git url: 'https://github.com/gititc778/sampleApp.git', branch: 'master'
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    buildDockerImage(buildTag)
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    input message: "Do you want to proceed with Kubernetes deployment?", ok: 'Deploy'
                }

                withCredentials([file(credentialsId: 'kubeconfig-creds', variable: 'KUBECONFIG')]) {
                    script {
                        sh """
                            sed -i "s/IMAGE_TAG/${buildTag}/g" deployment.yaml
                            kubectl apply -f deployment.yaml
                        """
                    }
                }
            }
        }
    }
}
