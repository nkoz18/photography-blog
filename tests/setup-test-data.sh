#!/bin/bash
# File: tests/setup-test-data.sh

echo "Setting up test data..."

cd tests

# Create small test images using ImageMagick (if available)
if command -v convert >/dev/null 2>&1; then
    echo "Using ImageMagick to create test images..."
    
    # Create small test images
    for i in {1..5}; do
        convert -size 200x200 xc:blue -pointsize 30 -fill white \
            -gravity center -annotate +0+0 "Test $i" "test-batch-$i.jpg"
    done

    # Create a single test image
    convert -size 400x400 xc:green -pointsize 40 -fill white \
        -gravity center -annotate +0+0 "Single Test" "test-single.jpg"

    # Create a larger test image (5MB)
    convert -size 3000x3000 xc:red -quality 95 \
        -pointsize 100 -fill white -gravity center \
        -annotate +0+0 "Large Test" "test-large.jpg"

    echo "✓ Test images created with ImageMagick"
else
    echo "ImageMagick not found. Creating minimal test files..."
    
    # Create minimal test files (not real images, but will work for testing)
    for i in {1..5}; do
        echo "Test image $i" > "test-batch-$i.jpg"
    done
    echo "Single test image" > "test-single.jpg"
    
    # Create a larger test file
    dd if=/dev/zero of=test-large.jpg bs=1M count=5 2>/dev/null
    
    echo "✓ Test files created (note: install ImageMagick for real images)"
fi

echo "Test data setup complete!"
echo ""
echo "Files created:"
ls -lh test-*.jpg