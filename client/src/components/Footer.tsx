export const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          © 2024 CodeHub. All rights reserved.
        </p>

        <div className="flex gap-4 text-sm">
          <a href="#" className="text-muted-foreground hover:text-primary">
            Privacy
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary">
            Terms
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary">
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}
