import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const run = cmd => execSync(cmd, { stdio: 'inherit' })

// Save the current mongoose devDependency so we can restore it afterwards.
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const originalMongoose = pkg.devDependencies.mongoose

run('docker compose up -d --wait')
run('pnpm add -D mongoose@8')

let exitCode = 0
try {
  run('pnpm test')
} catch (err) {
  exitCode = err.status ?? 1
}

// Always restore the original mongoose version and bring down the container.
try {
  run(`pnpm add -D "mongoose@${originalMongoose}"`)
  run('docker compose down')
} catch (error) {
  console.error('Error during cleanup:', error)
}

process.exit(exitCode)
