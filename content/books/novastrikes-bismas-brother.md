---
title: NovaStrikes | Bisma's Brother
status: published
genre: fantasy
cover: /images/uploads/nvx-logo-1-.png
emoji: 🤯
description: Hi I'm Hamayl AKA NovaStrikes/NvxStrikes My Brand. Hehe Support my SIster
tags:
  - novastrikes
beta_open: true
order: 1
---

I don't know what to say this is Just a Test so i'm going to copy a Random thing and Paste it Here
\

# ============================================================

#  blender_manifest.toml — Auto File Cleaner v2.0.1

#  Blender Extension Manifest (schema v1.0.0)

#  Required for Blender 4.2+ Extension system & BlenderKit

# ============================================================

schema_version = "1.0.0"

# ── Identity ─────────────────────────────────────────────────

# IMPORTANT: id must be lowercase, underscores only, no spaces.

# Your addon FOLDER must be named exactly this (auto_file_cleaner).

id = "auto_file_cleaner"

version = "2.0.1"

name = "Auto File Cleaner"

tagline = "Scan, preview and safely remove unused datablocks from your .blend"

maintainer = "Hamayl - NovaStrikes"

# Supported types: "add-on" or "theme"

type = "add-on"

# ── Blender Version Support ───────────────────────────────────

# 4.2.0 is the first version that supports the Extension system

blender_version_min = "4.2.0"

# Remove this line if you want no upper limit.

# Set it if you want to cap support at a known-working version.

# blender_version_max = "5.9.9"

# ── Links ────────────────────────────────────────────────────

# Optional but recommended — fill in once you have your pages.

website = "https://superhivemarket.com"

# ── License ──────────────────────────────────────────────────

# SPDX identifier format is required by Blender.

# GPL-3.0-or-later matches the GNU GPL v3 in your __init__.py.

license = [

  "SPDX:GPL-3.0-or-later",

]

# ── Copyright ────────────────────────────────────────────────

copyright = [

  "2025 Hamayl - NovaStrikes",

]

# ── Category Tags ────────────────────────────────────────────

# Pick from Blender's official tag list. These appear in the

# Extensions platform and BlenderKit search/filter.

tags = [

  "System",

  "Pipeline",

]

# ── Permissions ──────────────────────────────────────────────

# Declare ONLY the permissions your extension actually uses.

# Auto File Cleaner writes backup .blend files to disk, so

# the "files" permission is required.

# It does NOT use the network, clipboard, or camera.

[permissions]

files = "Writes timestamped .blend backup files to the user-chosen backup folder before any deletion."

# ── Build Config ─────────────────────────────────────────────

# Controls what gets included / excluded when you run:

#   blender --command extension build

# Excludes dev clutter from the published zip.

[build]

paths_exclude_pattern = [

  "__pycache__/",

  "\*.pyc",

  ".git/",

  "\*.zip",

  ".DS_Store",

  "Thumbs.db",

  "\*.blend1",

  "\*.blend2",

  "tests/",

  "docs/",

  "README.md",

]
