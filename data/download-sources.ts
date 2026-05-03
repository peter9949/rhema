/**
 * Downloads Bible source data files from GitHub.
 * Run: bun run data/download-sources.ts
 */

import { mkdir, rm } from "node:fs/promises"
import { join } from "node:path"

const DATA_DIR = import.meta.dir
const SOURCES_DIR = join(DATA_DIR, "sources")
const CROSS_REFS_DIR = join(DATA_DIR, "cross-refs")

const BASE_URL =
  "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json"

const TRANSLATIONS = [
  { file: "KJV.json", name: "King James Version" },
  { file: "SpaRV.json", name: "Reina-Valera 1909" },
  { file: "FreJND.json", name: "J.N. Darby French" },
  { file: "PorBLivre.json", name: "Biblia Livre" },
  { file: "PolGdanska.json", name: "Polish Biblia Gdanska (1881)" },
  { file: "PolUGdanska.json", name: "Updated Gdansk Bible" },
]

const CROSS_REFS_URL = "https://a.openbible.info/data/cross-references.zip"

async function downloadFile(url: string, dest: string): Promise<void> {
  console.log(`  Downloading ${url}...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  const buffer = await res.arrayBuffer()
  await Bun.write(dest, buffer)
  const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(1)
  console.log(`  ✓ Saved ${dest} (${sizeMB} MB)`)
}

async function extractZip(zipDest: string, outDir: string): Promise<void> {
  if (process.platform === "win32") {
    const proc = Bun.spawn(
      [
        "powershell",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        `Expand-Archive -Path '${zipDest}' -DestinationPath '${outDir}' -Force`,
      ],
      {
        stdout: "inherit",
        stderr: "inherit",
      },
    )
    const code = await proc.exited
    if (code !== 0) {
      throw new Error(`Failed to extract zip via PowerShell (exit ${code})`)
    }
    return
  }

  const proc = Bun.spawn(["unzip", "-o", zipDest, "-d", outDir], {
    stdout: "inherit",
    stderr: "inherit",
  })
  const code = await proc.exited
  if (code !== 0) {
    throw new Error(`Failed to extract zip via unzip (exit ${code})`)
  }
}

async function main() {
  await mkdir(SOURCES_DIR, { recursive: true })
  await mkdir(CROSS_REFS_DIR, { recursive: true })

  // Download Bible translations
  console.log("\n📖 Downloading Bible translations...\n")
  for (const t of TRANSLATIONS) {
    const dest = join(SOURCES_DIR, t.file)
    const file = Bun.file(dest)
    if (await file.exists()) {
      console.log(`  ⏭ ${t.file} already exists, skipping`)
      continue
    }
    await downloadFile(`${BASE_URL}/${t.file}`, dest)
  }

  // Download cross-references
  console.log("\n🔗 Downloading cross-references...\n")
  const crossRefFile = join(CROSS_REFS_DIR, "cross_references.txt")
  const existing = Bun.file(crossRefFile)
  if ((await existing.exists()) && existing.size > 1000) {
    console.log(`  ⏭ cross_references.txt already exists, skipping`)
  } else {
    const zipDest = join(CROSS_REFS_DIR, "cross-references.zip")
    const existingZip = Bun.file(zipDest)
    if (!(await existingZip.exists()) || existingZip.size < 1000) {
      await downloadFile(CROSS_REFS_URL, zipDest)
    } else {
      console.log(`  ⏭ cross-references.zip already exists, extracting`)
    }
    await extractZip(zipDest, CROSS_REFS_DIR)
    await rm(zipDest, { force: true })
  }

  console.log("\n✅ All source data downloaded!\n")
}

main().catch((err) => {
  console.error("❌ Download failed:", err)
  process.exit(1)
})
