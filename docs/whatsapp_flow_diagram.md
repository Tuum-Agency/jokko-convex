# Architecture : Connexion WhatsApp (Embedded Signup avec Sélection)

Ce diagramme explique le flux de données entre le Client (Frontend), notre Serveur (Convex) et Meta (WhatsApp API) suite aux récentes améliorations.

## Diagramme de Séquence

```mermaid
sequenceDiagram
    actor User as Utilisateur (Client)
    participant FE as Frontend (React)
    participant BE as Backend (Convex)
    participant Meta as Meta / WhatsApp API
    participant DB as Base de Données

    Note over User, Meta: Etape 1 : Connexion Facebook

    User->>FE: Clique "Se connecter avec Facebook"
    FE->>Meta: FB.login()
    Meta-->>FE: Retourne accessToken & userID

    Note over User, Meta: Etape 2 : Récupération des Numéros

    FE->>BE: fetchWhatsAppPhoneNumbers(token)
    BE->>Meta: GET /me/whatsapp_business_accounts
    Meta-->>BE: Retourne WABA ID
    BE->>Meta: GET /{waba_id}/phone_numbers
    Meta-->>BE: Retourne liste [Numéro 1, Numéro 2...]
    BE-->>FE: Retourne liste filtrée (ID, Nom, Qualité)

    Note over User, Meta: Etape 3 : Sélection & Finalisation

    FE->>User: Affiche la liste des numéros
    User->>FE: Sélectionne "Jokko Dakar" (+221...) à connecter
    User->>FE: Clique "Confirmer"

    FE->>BE: finalizeWhatsAppRegistration(token, wabaId, selectedPhoneId)
    BE->>DB: Sauvegarde config (token, ID choisi) dans 'organizations'
    DB-->>BE: Succès
    BE-->>FE: Succès

    FE->>User: Affiche "Connexion Réussie"
```

## Points Clés
1.  **Séparation des responsabilités :** Le Backend ne sauvegarde rien tant que l'utilisateur n'a pas choisi.
2.  **Transparence :** L'utilisateur voit exactement quel numéro (et sa qualité) sera connecté.
3.  **Sécurité :** Le token est validé deux fois (une fois pour lire, une fois pour l'enregistrement).
