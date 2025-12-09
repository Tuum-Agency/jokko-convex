import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed data for development.
 * Usage: npx convex run seed:seedTeam
 */
export const seedTeam = mutation({
    args: {},
    handler: async (ctx) => {
        // 1. Get the first organization or create one
        let org = await ctx.db.query("organizations").first();
        if (!org) {
            console.log("No organization found. Creating a default organization 'Jokko Demo'.");

            // Create a mock user first for the owner
            const ownerId = await ctx.db.insert("users", {
                name: "Demo Owner",
                email: "owner@jokko.demo",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            const orgId = await ctx.db.insert("organizations", {
                name: "Jokko Demo",
                slug: "jokko-demo",
                businessSector: "Technology",
                timezone: "UTC",
                locale: "en-US",
                onboardingStep: "COMPLETED",
                ownerId: ownerId,
                plan: "FREE",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            // Add owner membership
            await ctx.db.insert("memberships", {
                userId: ownerId,
                organizationId: orgId,
                role: "OWNER",
                status: "ONLINE",
                maxConversations: 100,
                activeConversations: 0,
                lastSeenAt: Date.now(),
                joinedAt: Date.now(),
            });

            org = await ctx.db.get(orgId);
        }

        if (!org) return; // Should not happen

        const orgId = org._id;
        console.log(`Seeding data for organization: ${org.name} (${orgId})`);

        // 2. Create Poles (Services)
        // SAV
        let savPole = await ctx.db
            .query("poles")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .filter((q) => q.eq(q.field("name"), "SAV"))
            .first();

        if (!savPole) {
            const savId = await ctx.db.insert("poles", {
                organizationId: orgId,
                name: "SAV",
                description: "Service Après-Vente et Support Client",
                color: "#10b981", // Emerald green
                icon: "Headphones",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            savPole = await ctx.db.get(savId);
            console.log("Created Pole: SAV");
        } else {
            console.log("Pole SAV already exists");
        }

        // Marketing
        let marketingPole = await ctx.db
            .query("poles")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .filter((q) => q.eq(q.field("name"), "Marketing"))
            .first();

        if (!marketingPole) {
            const marketingId = await ctx.db.insert("poles", {
                organizationId: orgId,
                name: "Marketing",
                description: "Equipe Marketing et Communication",
                color: "#f43f5e", // Rose
                icon: "Megaphone", // Assuming mapped to something valid or default
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            marketingPole = await ctx.db.get(marketingId);
            console.log("Created Pole: Marketing");
        } else {
            console.log("Pole Marketing already exists");
        }

        if (!marketingPole) return; // Should not happen

        // 3. Create Agent: Fatou Ndiaye
        // Check if user exists by email
        let fatou = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", "fatou.ndiaye@jokko.co"))
            .first();

        if (!fatou) {
            const userId = await ctx.db.insert("users", {
                name: "Fatou Ndiaye",
                email: "fatou.ndiaye@jokko.co",
                image: "https://i.pravatar.cc/150?u=fatou", // Mock avatar
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            fatou = await ctx.db.get(userId);
            console.log("Created User: Fatou Ndiaye");
        } else {
            console.log("User Fatou Ndiaye already exists");
        }

        if (!fatou) return;

        // 4. Create Membership for Fatou
        const existingMembership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", fatou!._id).eq("organizationId", orgId))
            .first();

        if (!existingMembership) {
            await ctx.db.insert("memberships", {
                userId: fatou._id,
                organizationId: orgId,
                role: "AGENT",
                poleId: marketingPole._id,
                status: "OFFLINE",
                maxConversations: 10,
                activeConversations: 0,
                lastSeenAt: Date.now(),
                joinedAt: Date.now(),
            });
            console.log("Added Fatou to Marketing team");
        } else {
            console.log("Fatou is already a member");
            // Optional: Update pole if different
            if (existingMembership.poleId !== marketingPole._id) {
                await ctx.db.patch(existingMembership._id, {
                    poleId: marketingPole._id
                });
                console.log("Updated Fatou's pole to Marketing");
            }
        }

        // 5. Add 'momoseck8@gmail.com' as OWNER if exists
        let userMomo = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", "momoseck8@gmail.com"))
            .first();

        if (!userMomo) {
            console.log("Creating dev user momoseck8@gmail.com");
            const userId = await ctx.db.insert("users", {
                name: "Mamadou Seck",
                email: "momoseck8@gmail.com",
                image: "https://github.com/shadcn.png",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            userMomo = await ctx.db.get(userId);
        }

        if (userMomo) {
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user_org", (q) => q.eq("userId", userMomo!._id).eq("organizationId", orgId))
                .first();

            if (!membership) {
                await ctx.db.insert("memberships", {
                    userId: userMomo._id,
                    organizationId: orgId,
                    role: "OWNER",
                    status: "ONLINE",
                    maxConversations: 100,
                    activeConversations: 0,
                    lastSeenAt: Date.now(),
                    joinedAt: Date.now(),
                });
                console.log("Added momoseck8@gmail.com as OWNER to Jokko Demo");
            } else {
                // Ensure OWNER role
                if (membership.role !== "OWNER") {
                    await ctx.db.patch(membership._id, { role: "OWNER" });
                    console.log("Promoted momoseck8@gmail.com to OWNER");
                }
            }

            // Also update user's current org to this one
            const session = await ctx.db.query("userSessions").withIndex("by_user", q => q.eq("userId", userMomo!._id)).first();
            if (session) {
                await ctx.db.patch(session._id, { currentOrganizationId: orgId });
            } else {
                await ctx.db.insert("userSessions", {
                    userId: userMomo._id,
                    currentOrganizationId: orgId,
                    lastActivityAt: Date.now()
                });
            }
        }

        return "Seeding completed successfully!";
    }
});

export const seedAssignments = mutation({
    args: {},
    handler: async (ctx) => {
        // 1. Get Org
        const org = await ctx.db.query("organizations").first();
        if (!org) throw new Error("Run seedTeam first to create org");
        const orgId = org._id;

        // 2. Create Poles (Departments) for Assignments
        // Check if exists
        let salesPole = await ctx.db.query("poles").withIndex("by_organization", q => q.eq("organizationId", orgId)).filter((q) => q.eq(q.field("name"), "Ventes")).first();
        if (!salesPole) {
            const id = await ctx.db.insert("poles", {
                organizationId: orgId,
                name: "Ventes",
                description: "Sales Department",
                color: "#3b82f6", // Blue
                icon: "Briefcase",
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            salesPole = await ctx.db.get(id);
        }

        let supportPole = await ctx.db.query("poles").withIndex("by_organization", q => q.eq("organizationId", orgId)).filter((q) => q.eq(q.field("name"), "Support")).first();
        if (!supportPole) {
            const id = await ctx.db.insert("poles", {
                organizationId: orgId,
                name: "Support",
                description: "Customer Support",
                color: "#10b981", // Green
                icon: "Headphones",
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            supportPole = await ctx.db.get(id);
        }

        // 3. Init Agents for all Members
        const memberships = await ctx.db.query("memberships").withIndex("by_organization", q => q.eq("organizationId", orgId)).collect();
        for (const m of memberships) {
            // Check if agent exists
            const existingAgent = await ctx.db.query("agents").withIndex("by_member", q => q.eq("memberId", m.userId)).first();
            if (!existingAgent) {
                await ctx.db.insert("agents", {
                    organizationId: orgId,
                    memberId: m.userId,
                    departmentIds: [salesPole!._id], // Assign to Sales by default
                    primaryDepartmentId: salesPole!._id,
                    status: "ONLINE", // Force online for demo
                    maxConcurrentChats: 5,
                    currentActiveChats: 0, // Reset for demo
                    routingPriority: 1,
                    autoAccept: true,
                    acceptNewChats: true,
                    lastActivityAt: Date.now(),
                    statusUpdatedAt: Date.now(),
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }
        }

        // 4. Create Dummy Conversations (Unassigned)
        const messages = [
            "Bonjour, quelles voitures sont dispos ce week-end ?",
            "Mon paiement Wave a échoué",
            "Je veux louer un utilitaire pour un déménagement",
            "C'est quoi vos horaires à l'agence de Mermoz ?",
            "SOS: Panne sur l'autoroute à péage"
        ];

        for (const msg of messages) {
            // Check duplicates to avoid spamming on re-seed
            const exist = await ctx.db.query("conversations").withIndex("by_org_status", q => q.eq("organizationId", orgId).eq("status", "OPEN")).filter((q) => q.eq(q.field("preview"), msg)).first();
            if (!exist) {
                await ctx.db.insert("conversations", {
                    organizationId: orgId,
                    channel: "WHATSAPP",
                    status: "OPEN",
                    preview: msg,
                    lastMessageAt: Date.now(),
                    unreadCount: 1,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    // assignedTo: undefined -> Unassigned
                });
            }
        }

        return "Assignments seeded";
    }
});
