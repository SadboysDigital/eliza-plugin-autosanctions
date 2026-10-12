import { Plugin, Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

// The action that allows the Eliza agent to check sanctions
const verifySanctionsAction: Action = {
    name: "VERIFY_ENTITY_SANCTIONS",
    similes: ["CHECK_OFAC", "VET_VENDOR", "CHECK_SANCTIONS", "VERIFY_ENTITY"],
    description: "Check if a company, individual, or vessel is on the US Treasury OFAC sanctions list. YOU MUST have a valid Base L2 transaction hash for a 0.05 USDC payment to the AutoSanctions master vault before calling this.",
    
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true; // Always available to the agent
    },
    
    handler: async (runtime: IAgentRuntime, message: Memory, state: State | undefined, options: any, callback?: any) => {
        try {
            // Extract entity name and tx hash from the agent's generated context/state
            // In a real production environment, you would use Eliza's model extraction utilities here.
            const entityName = options?.entity_name;
            const txHash = options?.transaction_hash;

            if (!entityName || !txHash) {
                callback({
                    text: "I need both an entity_name and a transaction_hash (0.05 USDC on Base) to perform the sanctions check."
                });
                return false;
            }

            callback({
                text: `Checking OFAC sanctions for "${entityName}" using payment hash ${txHash.substring(0,8)}...`
            });

            // Call the AutoSanctions API
            const response = await fetch("https://autosanctions.com/api/v1/verify-entity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entity_name: entityName,
                    transaction_hash: txHash
                })
            });

            const data = await response.json();

            if (!response.ok) {
                callback({ text: `AutoSanctions API Error: ${data.error || data.message || "Unknown error"}` });
                return false;
            }

            const isFlagged = data.result.name_match_found;
            
            if (isFlagged) {
                callback({ 
                    text: `🚨 WARNING: "${entityName}" WAS FOUND on the US Treasury OFAC sanctions list. ${data.result.flags_found} matches found. DO NOT TRANSACT with this entity. \n\nDisclaimer: ${data.meta.strict_legal_disclaimer}` 
                });
            } else {
                callback({ 
                    text: `✅ CLEAR: "${entityName}" was NOT found on the US Treasury OFAC sanctions list.\n\nDisclaimer: ${data.meta.strict_legal_disclaimer}` 
                });
            }

            return true;
        } catch (error: any) {
            callback({ text: `Failed to check sanctions: ${error.message}` });
            return false;
        }
    },
    
    examples: [
        [
            {
                user: "user1",
                content: { text: "Can you check if AEROCARIBBEAN AIRLINES is sanctioned? Here is the 0.05 USDC tx hash: 0x7c1e9a04d2b3f2d18e..." }
            },
            {
                user: "eliza",
                content: { 
                    text: "I will check the OFAC sanctions list for that entity using your payment hash.",
                    action: "VERIFY_ENTITY_SANCTIONS" 
                }
            }
        ]
    ]
};

// Export the plugin for ElizaOS
export const autosanctionsPlugin: Plugin = {
    name: "autosanctions",
    description: "Check entities against the US Treasury OFAC sanctions list via AutoSanctions.com.",
    actions: [verifySanctionsAction],
    evaluators: [],
    providers: [],
};

export default autosanctionsPlugin;
