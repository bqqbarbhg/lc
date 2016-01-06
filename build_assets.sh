#!/usr/bin/env bash

mkdir -p data

find assets/sprites -iname '*.png' | assets/tools/pack_sprites.exe data/atlas.json data/atlas.png assets/sprites/

mkdir -p data/mp3
assets/tools/convert_mp3.py assets/audio data/mp3
find data/mp3 -iname '*.mp3' | assets/tools/pack_binary.exe data/audio.json data/audio.bin data/mp3/
rm -rf data/mp3

cp -r assets/music data/

