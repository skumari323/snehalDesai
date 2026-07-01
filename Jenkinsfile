def buildTag = ''

pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "sampleapp"
        DOCKER_CREDENTIALS = "docker-login-itc"
        KUBE_NAMESPACE = "default"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git url: 'git url: 'https://github.com/skumari323/snehalDesai.git', branch: 'master''
            }
        }

        stage('Generate Build Tag') {
            steps {
                script {
                    def date = new Date().format('yyyyMMdd')
                    buildTag = "${date}.${env.BUILD_NUMBER}"
                    currentBuild.displayName = buildTag
                    env.BUILD_TAG = buildTag
                    echo "Build Tag: ${env.BUILD_TAG}"
                }
            }
        }

        stage('Build Application') {
            steps {
                sh 'dotnet restore'
                sh 'dotnet build -c Release'
                sh 'dotnet publish -c Release -o publish'
            }
        }

        stage('SonarQube Analysis (Optional)') {
            steps {
                script {
                    echo "Run SonarQube if configured"
                    // withSonarQubeEnv('MySonarServer') {
                    //     sh "dotnet sonarscanner begin /k:sampleapp"
                    //     sh "dotnet build"
                    //     sh "dotnet sonarscanner end"
                    // }
                }
            }
        }

        stage('Quality Gate (Optional)') {
            steps {
                script {
                    echo "Skipping quality gate if not configured"
                    // waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:${env.BUILD_TAG} ."
                }
            }
        }

        stage('Trivy Security Scan') {
            steps {
                sh """
                    trivy image --format table \
                    -o trivy-report.txt \
                    ${DOCKER_IMAGE}:${env.BUILD_TAG} || true
                """
            }

            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.txt', fingerprint: true
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS,
                    usernameVariable: 'USER',
                    passwordVariable: 'PASS')]) {

                    sh """
                        echo $PASS | docker login -u $USER --password-stdin
                        docker tag ${DOCKER_IMAGE}:${env.BUILD_TAG} $USER/${DOCKER_IMAGE}:${env.BUILD_TAG}
                        docker push $USER/${DOCKER_IMAGE}:${env.BUILD_TAG}
                    """
                }
            }
        }

        stage('Deploy to DEV') {
            steps {
                sh """
                    kubectl apply -f deployment.yaml
                    kubectl set image deployment/sampleapp sampleapp=$USER/${DOCKER_IMAGE}:${env.BUILD_TAG}
                """
            }
        }

        stage('Approval for PROD') {
            steps {
                input message: "Deploy to PRODUCTION?"
            }
        }

        stage('Deploy to PROD') {
            steps {
                sh """
                    kubectl apply -f deployment-prod.yaml
                    kubectl set image deployment/sampleapp-prod sampleapp=$USER/${DOCKER_IMAGE}:${env.BUILD_TAG}
                """
            }
        }
    }

    post {
        success {
            echo "Pipeline SUCCESS"
        }
        failure {
            echo "Pipeline FAILED"
        }
        always {
            echo "Cleaning workspace"
            cleanWs()
        }
    }
}
