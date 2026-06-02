import hudson.security.FullControlOnceLoggedInAuthorizationStrategy
import jenkins.model.Jenkins
import jenkins.security.s2m.AdminWhitelistRule

def instance = Jenkins.get()
def username = System.getenv('JENKINS_ADMIN_USER') ?: 'admin'
def password = System.getenv('JENKINS_ADMIN_PASSWORD') ?: 'admin'

def realm = new hudson.security.HudsonPrivateSecurityRealm(false)
if (realm.getUser(username) == null) {
    realm.createAccount(username, password)
}

def authorizationStrategy = new FullControlOnceLoggedInAuthorizationStrategy()
authorizationStrategy.setAllowAnonymousRead(false)

instance.setSecurityRealm(realm)
instance.setAuthorizationStrategy(authorizationStrategy)
instance.getInjector().getInstance(AdminWhitelistRule.class).setMasterKillSwitch(false)
instance.save()
