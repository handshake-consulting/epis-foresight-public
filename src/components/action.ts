"use server"

import { cookies } from "next/headers"


export const saveToken = async (token: string) => {

    try {
        const cookeList = await cookies()
        cookeList.set('authz-token', token)
    } catch (e) {
        console.log(e);

    }


}