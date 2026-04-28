pipeline {
    agent any

    stages {
        stage('Clone') {
            steps {
                git branch: 'main', url: 'https://github.com/DHEEPISHAGANDHI/devops-project.git'
            }
        }

        stage('Build') {
            steps {
                sh 'echo "Project cloned successfully"'
            }
        }
    }
}

















// pipeline {
//     agent any

//     stages {
//        stage('Clone') {
//     steps {
//         git branch: 'main', url: 'https://github.com/DHEEPISHAGANDHI/devops-project.git'
//     }
// }

//         stage('Terraform Init') {
//             steps {
//                 sh 'cd terraform && terraform init'
//             }
//         }

//         stage('Terraform Apply') {
//     steps {
//         sh 'cd terraform && terraform destroy -auto-approve || true'
//         sh 'cd terraform && terraform apply -auto-approve'
//     }
// }
//     }
// }