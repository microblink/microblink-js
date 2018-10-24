#!/bin/bash
FILENAME="README-at-docs.md"

echo "Build $FILENAME"

DEMO=$(cat ./sample/demo-at-docs.md)

README=$(cat README.md)

PLACEHOLDER="<!-- ./sample/demo-at-docs.md -->"

echo "${README/$PLACEHOLDER/$DEMO}" > $FILENAME
