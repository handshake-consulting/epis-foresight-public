import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

const page = async () => {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        // If there's an error or no user, redirect to the login page
        redirect("/login")
    }
    return (
        <div>page</div>
    )
}

export default page