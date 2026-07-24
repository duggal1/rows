import { Template, waitForURL, defaultBuildLogger } from "e2b"

export const nextjsBunTemplate = Template()
  .fromBunImage("1.3")
  .runCmd("bun create next-app@latest /home/user/app --yes")
  .setWorkdir("/home/user/app")
  .setStartCmd("bun run dev", waitForURL("http://localhost:3000"))

async function build() {
  console.log("Building nextjs-bun-base template...")
  await Template.build(nextjsBunTemplate, "nextjs-bun-base", {
    cpuCount: 2,
    memoryMB: 2048,
    onBuildLogs: defaultBuildLogger(),
  })
  console.log("Done. Template slug: nextjs-bun-base")
}

build().catch(console.error)
