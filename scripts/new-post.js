/* This is a script to create a new post markdown file with front-matter */

import fs from "fs"
import path from "path"

const targetDir = "./src/content/posts/"
const fileExtensionRegex = /\.(md|mdx)$/i

function getDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getMonthDir(date) {
  return date.slice(0, 7).replace("-", "")
}

function stripExtension(input) {
  return input.replace(fileExtensionRegex, "")
}

function getExtension(input) {
  const match = input.match(fileExtensionRegex)
  return match ? match[0].toLowerCase() : ".md"
}

function toSlug(input) {
  return stripExtension(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function pathExistsForSlug(monthDir, slug) {
  return (
		fs.existsSync(path.join(targetDir, monthDir, `${slug}.md`)) ||
		fs.existsSync(path.join(targetDir, monthDir, `${slug}.mdx`)) ||
		fs.existsSync(path.join(targetDir, monthDir, slug))
  )
}

function getUniqueSlug(monthDir, baseSlug) {
  let slug = baseSlug
  let index = 2

	while (pathExistsForSlug(monthDir, slug)) {
    slug = `${baseSlug}-${index}`
    index += 1
  }

  return slug
}

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error(`Error: No title or slug argument provided
Usage: pnpm new-post <title-or-slug>`)
  process.exit(1) // Terminate the script and return error code 1
}

const rawTitle = args.join(" ").trim()
const extension = getExtension(rawTitle)
const published = getDate()
const monthDir = getMonthDir(published)
const topicSlug = toSlug(rawTitle)
const baseSlug = topicSlug

if (!topicSlug) {
  console.error("Error: Could not generate a topic slug. Please provide an English topic, for example: my-new-post")
  process.exit(1)
}

const slug = getUniqueSlug(monthDir, baseSlug)
const fileName = `${slug}${extension}`
const fullPath = path.join(targetDir, monthDir, fileName)

// recursive mode creates multi-level directories
const dirPath = path.dirname(fullPath)
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true })
}

const content = `---
title: ${stripExtension(rawTitle)}
published: ${published}
description: ''
image: ''
tags: []
category: ''
draft: false
lang: ''
---
`

fs.writeFileSync(fullPath, content)

console.log(`Post ${fullPath} created`)
if (slug !== baseSlug) {
  console.log(`Filename conflict detected. Used ${slug} instead of ${baseSlug}.`)
}
