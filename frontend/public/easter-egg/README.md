# Easter Egg Assets

This directory contains assets for the Konami code easter egg:

## Current Implementation

The easter egg is triggered when a user enters the Konami code (↑ ↑ ↓ ↓ ← → ← → B A) and features:

- Character animation that moves randomly from left to right or right to left
- Bobbing up and down motion as the character moves
- Character flips direction based on movement direction
- Sound plays during the animation
- Mobile support via tap detection

## Assets

1. Character image: `images/silky.png`
   - PNG image of the character that moves across the screen
   - Displayed at 120px height with automatically proportional width
   - Works best with a transparent background

2. Sound effect: `sounds/silky.mp3`
   - Sound that plays when the easter egg is triggered
   - Will loop if the animation duration exceeds the sound length

## Mobile Support

On mobile devices, users can trigger the easter egg by tapping the screen 10 times in sequence.
The timing between taps shouldn't exceed 1.5 seconds. 