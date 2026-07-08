const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0xArk1o3YE3aWeEWrG7kTfKeDgNAPTtiUB0wP9NmSBoirb20XTFC4DtDQ7xKBX17cZOuiN8CmO6tV/pub?gid=67709652&single=true&output=csv";

d3.csv(csvUrl).then(rawData => {

  const registros = rawData
    .filter(d => d["CATEGORÍA PRE"] && d["SUBCATEGORÍA PRE"])
    .map(d => ({
      categoria: d["CATEGORÍA PRE"].trim(),
      subcategoria: d["SUBCATEGORÍA PRE"].trim()
    }));

  const conteo = d3.rollups(
    registros,
    v => v.length,
    d => d.categoria,
    d => d.subcategoria
  );

  const data = {
    name: "Mesa de Vigilancia",
    children: conteo.map(([categoria, subcategorias]) => ({
      name: categoria,
      children: subcategorias.map(([subcategoria, frecuencia]) => ({
        name: subcategoria,
        value: frecuencia
      }))
    }))
  };

  dibujarTreemap(data);
});

function dibujarTreemap(data) {
  const width = 1200;
  const height = 700;

  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  d3.treemap()
    .size([width, height])
    .paddingOuter(8)
    .paddingTop(30)
    .paddingInner(3)
    .round(true)(root);

  const svg = d3.select("#treemap")
    .html("")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const totalRegistros = root.value;

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  const color = d3.scaleOrdinal()
  .domain(root.children.map(d => d.data.name))
  .range(["#1E5AA8", "#00A6A6", "#4CAF50", "#F57C00", "#7E57C2", "#8E8E8E"]);

  const categories = svg.selectAll(".category")
    .data(root.children)
    .enter()
    .append("g");

  categories.append("rect")
  .attr("x", d => d.x0)
  .attr("y", d => d.y0)
  .attr("width", d => d.x1 - d.x0)
  .attr("height", d => d.y1 - d.y0)
  .attr("fill", d => color(d.data.name))
  .attr("opacity", 0.08)
  .attr("stroke", "none")
  .attr("rx", 10)
  .attr("ry", 10);

  categories.append("text")
    .attr("x", d => d.x0 + 10)
    .attr("y", d => d.y0 + 20)
    .attr("fill", "#1E3A5F")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text(d => d.data.name);

  const leaves = svg.selectAll(".leaf")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("class", "leaf");

  leaves.append("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => color(d.parent.data.name))
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 3)
    .attr("opacity", 0.88)
.attr("rx", 6)
.attr("ry", 6)
    .on("mouseover", function(event, d) {
      const porcentaje = ((d.data.value / totalRegistros) * 100).toFixed(1);

      tooltip
        .style("opacity", 1)
        .html(`
          <div class="tooltip-title">${d.data.name}</div>
          <div class="tooltip-row"><strong>Categoría:</strong> ${d.parent.data.name}</div>
          <div class="tooltip-row"><strong>Registros:</strong> ${d.data.value}</div>
          <div class="tooltip-row"><strong>Participación:</strong> ${porcentaje}%</div>
        `);

      svg.selectAll(".leaf rect")
        .transition()
        .duration(150)
        .attr("opacity", 0.35);

      d3.select(this)
        .transition()
        .duration(150)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .attr("opacity", 1)
        .attr("filter", "drop-shadow(0px 4px 8px rgba(0,0,0,0.35))");
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 14) + "px")
        .style("top", (event.pageY + 14) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("opacity", 0);

      svg.selectAll(".leaf rect")
        .transition()
        .duration(150)
        .attr("opacity", 0.82)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 3)
        .attr("filter", null);
    });

  leaves.append("text")
  .attr("x", d => d.x0 + 8)
  .attr("y", d => d.y0 + 22)
  .attr("fill", "white")
  .attr("font-size", "13px")
  .attr("font-weight", "bold")
  .style("pointer-events", "none")
  .each(function(d) {
    const text = d3.select(this);
    const width = d.x1 - d.x0;
    const height = d.y1 - d.y0;
    const name = d.data.name;

    if (width < 95 || height < 35) {
      text.text("");
      return;
    }

    const maxChars = Math.floor(width / 7);

    if (name.length > maxChars) {
      text.text(name.substring(0, Math.max(6, maxChars - 3)) + "...");
    } else {
      text.text(name);
    }
  });
}