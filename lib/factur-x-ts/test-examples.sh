#!/bin/bash

cd /home/user/accounting-tools/lib/factur-x-ts

for file in examples/0*.ts; do
  echo "Testing $(basename $file)..."
  if npx ts-node "$file" > /dev/null 2>&1; then
    echo "  ✅ Success"
  else
    echo "  ❌ Failed"
  fi
done
