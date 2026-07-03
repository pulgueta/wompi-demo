import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/tanstack-react-start"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <p className="text-sm font-medium">Wompi Demo</p>
          <p className="text-xs text-muted-foreground">Clerk authentication</p>
        </div>
        <nav className="flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost">Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Sign up</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </nav>
      </header>

      <main className="flex flex-1 items-center p-6">
        <div className="mx-auto flex max-w-xl min-w-0 flex-col gap-5 text-sm leading-loose">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Project ready</p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Authentication is ready to try.
            </h1>
            <p className="text-muted-foreground">
              Use the actions in the navigation to create your first test
              account. Once you are signed in, the profile button appears in
              the same spot.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
