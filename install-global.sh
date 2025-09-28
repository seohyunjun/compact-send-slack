#!/bin/bash

# Global installation script for compact-slack

echo "📦 Installing compact-slack globally..."

# Create global binary directory
mkdir -p ~/.local/bin

# Copy the built CLI
cp dist/cli.js ~/.local/bin/compact-slack
cp global-config.js ~/.local/bin/compact-slack-config.js

# Update the import path in the CLI
sed -i '' 's|../global-config.js|./compact-slack-config.js|g' ~/.local/bin/compact-slack

# Make executable
chmod +x ~/.local/bin/compact-slack

echo "✅ compact-slack installed to ~/.local/bin/compact-slack"
echo ""
echo "To use globally, add ~/.local/bin to your PATH:"
echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.zshrc"
echo "  source ~/.zshrc"
echo ""
echo "Or create a symlink to /usr/local/bin:"
echo "  sudo ln -sf ~/.local/bin/compact-slack /usr/local/bin/compact-slack"