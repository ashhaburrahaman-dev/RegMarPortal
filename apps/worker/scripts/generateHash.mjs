#!/usr/bin/env node
/**
 * Generates bcrypt password hashes for the seed file.
 * Run: node scripts/generateHash.mjs
 * Then copy the output into scripts/seed.sql
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const bcrypt = require('bcryptjs')

const SALT_ROUNDS = 12

console.log('Generating bcrypt hashes (this takes a few seconds)...\n')

const [adminHash, operatorHash] = await Promise.all([
  bcrypt.hash('Admin@1234', SALT_ROUNDS),
  bcrypt.hash('Oper@1234', SALT_ROUNDS),
])

console.log('=== Copy these into scripts/seed.sql ===\n')
console.log(`Admin hash (Admin@1234):\n${adminHash}\n`)
console.log(`Operator hash (Oper@1234):\n${operatorHash}\n`)
console.log('⚠  Change these passwords immediately after first deployment!')
