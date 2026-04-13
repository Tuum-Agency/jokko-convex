import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentOrg } from "./use-current-org";
import { Id } from "@/convex/_generated/dataModel";

export function useChannels() {
    const { currentOrg } = useCurrentOrg();

    const channels = useQuery(
        api.channels.list,
        currentOrg ? { organizationId: currentOrg._id as Id<"organizations"> } : "skip"
    );

    const createChannel = useMutation(api.channels.create);
    const updateChannel = useMutation(api.channels.update);
    const disableChannel = useMutation(api.channels.disable);
    const setOrgDefault = useMutation(api.channels.setOrgDefault);
    const addChannel = useAction(api.whatsapp.addChannel);
    const fetchPhoneNumbers = useAction(api.whatsapp.fetchWhatsAppPhoneNumbers);
    const getChannelStatus = useAction(api.whatsapp.getChannelStatus);
    const sendTestMessage = useAction(api.whatsapp.sendTestMessageByChannel);

    return {
        channels: channels ?? [],
        isLoading: channels === undefined,
        createChannel,
        updateChannel,
        disableChannel,
        setOrgDefault,
        addChannel,
        fetchPhoneNumbers,
        getChannelStatus,
        sendTestMessage,
    };
}
