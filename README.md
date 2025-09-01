# Catan Board Generator

An interactive **Catan board generator** built with React and Vite.  
Generates randomized Catan boards with configurable rules, pip constraints, and a violations breakdown.

---

## Features

- **Random board generation**  
  - Independent randomization for **resources** and **numbers**.
- **Pip score limits**  
  - Set minimum and maximum total pip probabilities per vertex.
- **Hot adjacency detection**  
  - Avoids placing **6** and **8** together when possible.
- **Optional toggles**  
  - Prevent identical neighboring numbers.
  - Prevent neighboring resources.
  - Keep desert in the center.
- **Accessible color palette**  
  - Forest = green  
  - Hills = red  
  - Ore = blue-gray  
  - Fields = yellow  
  - Pasture = light green  
  - Desert = white with diagonal stripes.
- **Violations breakdown**  
  Displays:
  - Hot adjacency count.
  - Identical number neighbors.
  - Identical resource neighbors.
  - Pip totals below min / above max.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/wunnle/catan-board-generator.git
cd catan-board-generator
