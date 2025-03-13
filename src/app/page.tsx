import { verifyFirebaseToken } from "@/utils/firebase/edge";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";


export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  // if (error || !user) {
  //   // If there's an error or no user, redirect to the login page
  //   redirect("/login")
  // }
  if (token) {
    const { valid } = await verifyFirebaseToken(token.value);
    if (valid) {
      redirect("/chat");
    }
  }
  // console.log(user);

  return redirect("/login")

  // return (
  //   <main className="flex min-h-screen flex-col items-center justify-center p-24">
  //     <div className="max-w-md w-full space-y-8">
  //       <div>
  //         <h1 className="text-3xl font-bold">Welcome to the Dashboard</h1>
  //         <p className="mt-2 text-gray-600">You are logged in as {user.email}</p>
  //       </div>

  //       <div className="mt-8">
  //         <form action="/auth/signout" method="post">
  //           <button
  //             type="submit"
  //             className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
  //           >
  //             Sign Out
  //           </button>
  //         </form>
  //         <Link
  //           href={'chat'}
  //           className="w-full my-2 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
  //         >
  //           Test Chat
  //         </Link>
  //       </div>
  //     </div>
  //   </main>
  // )
}

