#!/bin/bash
rm -r /usr/share/nginx/mythicalhero/*
git pull
npm run build
cp -r ./dist/* /usr/share/nginx/mythicalhero
