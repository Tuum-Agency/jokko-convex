# Tâche : Implémentation SSO & Sécurité Avancée (Enterprise)

Cette fonctionnalité est affichée dans le plan **Enterprise**. Elle doit être développée pour permettre aux grandes entreprises de gérer leurs accès de manière sécurisée.

## Fonctionnalités requises

### 1. Single Sign-On (SSO)
-   **Objectif** : Permettre la connexion via les fournisseurs d'identité d'entreprise (IdP).
-   **Protocoles** : Support SAML 2.0 et OpenID Connect (OIDC).
-   **Fournisseurs cibles** : Microsoft Azure AD, Google Workspace, Okta.
-   **Tech** : Potentiellement utiliser une solution comme Clerk Enterprise, Auth0, ou WorkOS pour gérer la complexité.

### 2. Logs d'Audit (Audit Logs)
-   **Objectif** : Tracer les actions sensibles pour la conformité.
-   **Données à logger** :
    -   Connexions / Déconnexions.
    -   Exports de contacts.
    -   Suppressions de données (campagnes, contacts).
    -   Modifications de paramètres d'organisation.
-   **Interface** : Tableau de bord administrateur pour voir et filtrer les logs.

### 3. Sécurité Avancée (Optionnel dans un premier temps)
-   **Whitelisting IP** : Restreindre l'accès au dashboard à certaines adresses IP (ex: VPN de l'entreprise).
-   **2FA Forcé** : Obliger tous les membres de l'organisation à activer l'authentification à deux facteurs.

## Priorité
Basse pour le lancement, mais critique dès la signature du premier grand compte "Enterprise".
