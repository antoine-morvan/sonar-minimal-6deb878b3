import groovy.json.JsonSlurper

node {
  try {
    def CI = 'true'
    def NODE_IMAGE='node:14.15.5'

    cleanWs()

    /*
     Requires Jenkins Plugin "SonarQube Scanner for Jenkins"
     then Sonar Scanner tool is defined in Jenkins under
     Manage Jenkins > Global Tool Configuration > SonarQube Scanner
     */
    def scannerHome = tool 'SonarQubeDefaultScanner'

    // checkout : 10 min timeout
    timeout(time: 10, unit: 'MINUTES') {
      stage('Clone Git Repo') {
        checkout scm

        // Get git commit information
        GIT_AUTHOR_EMAIL = sh (
              script: 'git --no-pager show -s --format=\'%ae\'',
              returnStdout: true
        ).trim()
        GIT_COMMITTER_EMAIL = sh (
              script: 'git --no-pager show -s --format=\'%ce\'',
              returnStdout: true
        ).trim()
        GIT_COMMIT_MSG = sh (
              script: "git --no-pager show -s --format='%s%n%b'",
              returnStdout: true
        )

        if (env.CHANGE_ID) {
            branchName = "PullRequest-${env.CHANGE_ID}"
        } else {
            branchName = "${env.BRANCH_NAME}"
        }
        lowCaseMsg = GIT_COMMIT_MSG.toLowerCase();
        SKIPCI = lowCaseMsg.contains("#skipci") || lowCaseMsg.contains("#noci");
        SKIPTRIGGER = lowCaseMsg.contains("#skiptrigger") || lowCaseMsg.contains("#notrigger");
      }
    }

    packageJson = readFile "${env.WORKSPACE}/package.json"
    PACKAGE_VERSION = new JsonSlurper().parseText(packageJson).version

    SONAR_PROJECT_BASE_NAME="sonarminimal"
    SONAR_HOST_URL="http://sonarqube:9000"

    if (branchName == "master") {
        projName = "${SONAR_PROJECT_BASE_NAME}"
        projVersion = "${PACKAGE_VERSION}"
    } else {
        projName = "${SONAR_PROJECT_BASE_NAME}/$branchName"
        projVersion = "${PACKAGE_VERSION}"
    }

    echo """
    Author = ${GIT_AUTHOR_EMAIL}
    Committer = ${GIT_COMMITTER_EMAIL}
    Commit message =
    --
${GIT_COMMIT_MSG}
    --
    SonarQube config:
      -Dproject.settings=.releng/sonar-project.properties
      -Dsonar.projectKey=com.myapp.${SONAR_PROJECT_BASE_NAME}:$branchName
      -Dsonar.projectName=$projName
      -Dsonar.projectVersion=$projVersion
      -Dsonar.host.url=${SONAR_HOST_URL}
    Skip Continuous Integration = ${SKIPCI}
    Skip Downstream Project Trigger = ${SKIPTRIGGER}
    """

    if (!SKIPCI) {
      // Fetch : 30 min timeout
      timeout(time: 30, unit: 'MINUTES') {
        stage ('Fetch Dependencies') {
          docker.image(NODE_IMAGE).inside() {
            sh "npm clean-install --no-optional"
          }
        }
      }

      // Linter : 5 min timeout
      timeout(time: 5, unit: 'MINUTES') {
        stage('ALL') {
          docker.image(NODE_IMAGE).inside() {
            sh "npm run all"
          }
        }
      }

      // Sonar : 30 min timeout
      timeout(time: 30, unit: 'MINUTES') {
        stage('SonarQube Analysis') {
            /*
              Requires Jenkins Plugin "SonarQube Scanner for Jenkins"
              then Sonar Scanner tool is defined in Jenkins under
              Manage Jenkins > Global Tool Configuration > SonarQube Scanner
              */
            withSonarQubeEnv('SonarQubeDefaultServer') {
              nodejs(nodeJSInstallationName: 'Node14.15.5'){
                sonarCmdLine = "${scannerHome}/bin/sonar-scanner"
                sonarCmdLine += " -Dproject.settings=.releng/sonar-project.properties"
                sonarCmdLine += " -Dsonar.projectKey=com.myapp.${SONAR_PROJECT_BASE_NAME}:$branchName"
                sonarCmdLine += " -Dsonar.projectName=$projName"
                sonarCmdLine += " -Dsonar.projectVersion=$projVersion"
                sonarCmdLine += " -Dsonar.host.url=${SONAR_HOST_URL}"
                sh "${sonarCmdLine}"
              }
            }
        }
        stage('SonarQube - Quality Gate') {
            timeout(time: 1, unit: 'HOURS') {
                def qg = waitForQualityGate()
                if (qg.status != 'OK') {
                    unstable """
  Pipeline aborted due to SonarQube quality gate failure: ${qg.status}
  Check status here : ${SONAR_HOST_URL}dashboard?id=com.myapp.${SONAR_PROJECT_BASE_NAME}:$branchName
  """
                }
            }
        }
      }

    } else {
        echo 'Skipped full build.'
    }
  } catch (e) {
    currentBuild.result = "FAILED"
    throw e
  } finally {
    try {
      // make sure files generated inside docker containers are deletable
      docker.image("busybox").inside("--user 0:0") {
        sh "chmod 777 -R ./node_modules/ ./target"
      }
    } catch (e) {
      // silent
    }
  }
}
