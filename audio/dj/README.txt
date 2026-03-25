Ambience DJ: drop any number of .wav files in this folder.

The game does not use filenames in code. It loads whatever is listed in manifest.json.

After adding or removing wav files, from the project root run:

  npm run dj:manifest

That rescans this folder and regenerates manifest.json. Dev and build run this automatically (predev / prebuild).
