pipeline {
    agent any



    stages {

        stage('Checkout') {
            steps {
                git url: 'https://github.com/skumari323/snehalDesai.git', branch: 'main'
            }
        }

        

        stage('Docker Build') {
            steps {
                sh '''
                docker build -t sampleapp:v10.5 .
                '''
            }
        }
stage('Docker Push') {
    steps {
        withCredentials([usernamePassword(
            credentialsId: 'dockerhub-creds',
            usernameVariable: 'USER',
            passwordVariable: 'PASS'
        )]) {
            sh '''
            echo $PASS | docker login -u $USER --password-stdin

            docker build -t sampleapp:v10.5 .

            docker tag sampleapp:v10.5 $USER/sampleapp:v10.5

            docker push $USER/sampleapp:v10.5
            '''
        }
    }
}

        stage('Deploy to Minikube') {
            steps {
                sh '''
                kubectl apply -f deployment.yaml 
                '''
            }
        }

        stage('Approve PROD') {
            steps {
                input message: "Deploy to PROD?"
            }
        }

        stage('Deploy PROD') {
            steps {
                sh '''
                kubectl apply -f prod.yaml
                '''
            }
        }
    }
}
