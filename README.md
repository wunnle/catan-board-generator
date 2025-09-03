# Catan Board Generator

🌐 **Website:** https://catan.wunnle.com/

An interactive **Catan board generator** built with React and Vite.  
Generates randomized Catan boards with configurable rules, pip constraints, and a violations breakdown.

---

## Features

- **Random board generation**  
  - Independent randomization for **resources** and **numbers**.
- **Corner score calculation & capping**  
  - Calculates pip probability totals for each vertex (corner).
  - Set minimum and maximum pip score limits to cap corner values.
  - Ensures balanced resource accessibility across the board.
- **Hot adjacency detection**  
  - Avoids placing **6** and **8** together when possible.
- **Optional toggles**  
  - Prevent identical neighboring numbers.
  - Prevent neighboring resources.
  - Keep desert in the center.
- **Accessible color palette**

---

## Installation

Clone the repository:

```bash
git clone https://github.com/wunnle/catan-board-generator.git
cd catan-board-generator
