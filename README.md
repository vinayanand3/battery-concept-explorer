# Battery Concept Explorer

A public educational Three.js viewer built entirely from procedural boxes and cylinders. No reference images, scanned geometry, STL files, private BOM data, or measured source dimensions are included.

The generic layout uses nine modules with two staggered layers of 192 cells each. These counts, positions, approximate dimensions, and illustrative material labels are authored demonstration parameters, not specifications of a production vehicle. Mass, electrical topology, thermal behavior, and engineering clearances are not validated or simulated.

Features: component selection, collapsed assembly browser, search, visibility, isolation, camera presets, opt-in annotations, and exploded view.

Run `npm install` and `npm run dev`. Build using `npm run build`. GitHub Actions builds and publishes to Pages.

## Expanded assembly coverage

The viewer now has 200 procedural component representations, guided by the detailed workspace's component labels and hierarchy. `src/inventory.json` contains only names, hierarchy labels, categories, and new concept identifiers. It does not contain source coordinates, bounds, geometry, materials, weights, or BOM values. `src/model.js` authors all shapes and dimensions from primitives.

There are nine conceptual module locations, with eighteen instanced cell layers and 3,456 illustrative cells. Eight module assemblies are shell representations; one module exposes the detailed component breakdown. This is inventory-level coverage, not replication of every internal feature in each source mesh. Holes, seals, fasteners, routing, and internal features are only present where explicitly modeled. Fitting, clearances, materials, mass, circuit topology, and thermal performance are not validated.

The assembly browser follows the nested grouping and starts collapsed. Search expands matching paths, selection opens the component's ancestors, and each component can be hidden, isolated, or focused. Module detail isolates the detailed module. Annotations remain off by default.

Changing geometry and dimensions does not by itself establish rights to redistribute source-derived labels or arrangement. This project makes no claim of licensing clearance or independent clean-room provenance.
