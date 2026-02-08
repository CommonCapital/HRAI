import { createAvatar } from "@dicebear/core";
import { identicon, initials } from "@dicebear/collection";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GeneratedAvatarProps {
    seed: string,
    className?: string,
    variant: "identicon" | "initials",

}

export const GeneratedAvatar = ({
    seed, 
    className,
    variant,
}: GeneratedAvatarProps) => {
    let avatar;

    if ( variant === "identicon") {
        avatar = createAvatar(identicon, {
            seed,

        })
    } else {
        avatar = createAvatar(initials, {
            seed,
            fontWeight: 500,
            fontSize: 42,
        })
    }
    return (
        <Avatar className={cn(className)}>
            <AvatarImage src={avatar.toDataUri()} alt="Avatar"/>
            <AvatarFallback>{seed.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
    )
}
