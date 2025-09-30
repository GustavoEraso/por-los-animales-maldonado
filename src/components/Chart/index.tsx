'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  select,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  max,
  line,
  curveMonotoneX,
  axisBottom,
  axisLeft,
  pie,
  arc as d3Arc,
  PieArcDatum,
  Selection,
} from 'd3';
import { gsap } from 'gsap/dist/gsap';

/**
 * Data structure for line/bar charts
 */
interface LineData {
  label: string;
  value: number;
}

/**
 * Data structure for multi-line charts
 */
interface MultiLineData {
  label: string;
  datasets: {
    name: string;
    value: number;
  }[];
}

/**
 * Data structure for pie charts
 */
interface PieData {
  name: string;
  value: number;
}

/**
 * Chart component props
 */
interface ChartProps {
  /** Type of chart to render */
  type: 'line' | 'pie' | 'bar';
  /** Data for the chart */
  data: LineData[] | MultiLineData[] | PieData[];
  /** Chart title */
  title?: string;
  /** Chart width (auto-responsive if not provided) */
  width?: number;
  /** Chart height (auto-responsive if not provided) */
  height?: number;
  /** Custom colors for the chart */
  colors?: string[];
  /** Animation duration in seconds */
  animationDuration?: number;
  /** Whether to show legend for pie charts (default: true for pie charts) */
  showLegend?: boolean;
}

/**
 * Reusable Chart component supporting line, pie, and bar charts with GSAP animations.
 *
 * Features:
 * - Responsive design with automatic mobile/desktop adaptations
 * - Smooth GSAP animations with stagger effects
 * - Automatic legend display for pie charts (can be disabled)
 * - Type-safe with specific D3 and TypeScript types
 * - Optimized bundle size with specific D3 imports
 *
 * @param props - Chart configuration
 * @returns Rendered chart component
 *
 * @example
 * // Line chart
 * <Chart
 *   type="line"
 *   data={[
 *     { label: 'Jan', value: 12 },
 *     { label: 'Feb', value: 15 }
 *   ]}
 *   title="Adoptions per month"
 * />
 *
 * @example
 * // Multi-line chart
 * <Chart
 *   type="line"
 *   data={[
 *     {
 *       label: 'Jan',
 *       datasets: [
 *         { name: 'Income', value: 2500 },
 *         { name: 'Expenses', value: 1800 }
 *       ]
 *     }
 *   ]}
 *   title="Income vs Expenses"
 * />
 *
 * @example
 * // Pie chart (legend shown by default)
 * <Chart
 *   type="pie"
 *   data={[
 *     { name: 'Adopted', value: 30 },
 *     { name: 'Available', value: 45 }
 *   ]}
 *   title="Animal status"
 * />
 *
 * @example
 * // Pie chart without legend
 * <Chart
 *   type="pie"
 *   data={statusData}
 *   title="Animal status"
 *   showLegend={false}
 * />
 */
export default function Chart({
  type,
  data,
  title,
  width,
  height,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'],
  animationDuration = 2,
  showLegend,
}: ChartProps) {
  const shouldShowLegend = showLegend !== undefined ? showLegend : type === 'pie';
  const chartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(0);

  // Responsive window listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    // Set initial width
    setWindowWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const svg = select(chartRef.current);
    svg.selectAll('*').remove();

    // Responsive dimensions
    const container = containerRef.current;
    const containerWidth = container?.clientWidth || 400;
    const isMobile = containerWidth < 640;

    const chartWidth = width || Math.min(containerWidth - 32, isMobile ? 320 : 400);
    const chartHeight = height || (isMobile ? 240 : 300);

    if (type === 'line' || type === 'bar') {
      renderLineOrBarChart(
        svg,
        data as LineData[] | MultiLineData[],
        chartWidth,
        chartHeight,
        isMobile,
        type
      );
    } else if (type === 'pie') {
      renderPieChart(svg, data as PieData[], chartWidth, chartHeight, isMobile);
    }
  }, [type, data, width, height, colors, animationDuration, windowWidth]);

  const renderLineOrBarChart = (
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    chartData: LineData[] | MultiLineData[],
    chartWidth: number,
    chartHeight: number,
    isMobile: boolean,
    chartType: 'line' | 'bar'
  ) => {
    const margin = {
      top: 20,
      right: isMobile ? 20 : 30,
      bottom: 40,
      left: isMobile ? 30 : 40,
    };

    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    const g = svg
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Detect if it's multi-line data
    const isMultiLine = chartData.length > 0 && 'datasets' in chartData[0];
    const multiData = chartData as MultiLineData[];
    const singleData = chartData as LineData[];

    // Scales
    const xScale = scaleBand()
      .domain(chartData.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.1);

    let maxValue = 0;
    if (isMultiLine) {
      maxValue = max(multiData, (d) => max(d.datasets, (dataset) => dataset.value) || 0) || 0;
    } else {
      maxValue = max(singleData, (d) => d.value) || 0;
    }

    const yScale = scaleLinear().domain([0, maxValue]).nice().range([innerHeight, 0]);

    // Axes
    g.append('g').attr('transform', `translate(0,${innerHeight})`).call(axisBottom(xScale));

    g.append('g').call(axisLeft(yScale));

    if (chartType === 'line') {
      if (isMultiLine) {
        // Multi-line chart
        const datasets = multiData[0]?.datasets || [];

        datasets.forEach((_, datasetIndex) => {
          const lineGenerator = line<{ label: string; value: number }>()
            .x((d) => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
            .y((d) => yScale(d.value))
            .curve(curveMonotoneX);

          const lineData = multiData.map((d) => ({
            label: d.label,
            value: d.datasets[datasetIndex]?.value || 0,
          }));

          const path = g
            .append('path')
            .datum(lineData)
            .attr('fill', 'none')
            .attr('stroke', colors[datasetIndex % colors.length])
            .attr('stroke-width', 2)
            .attr('d', lineGenerator);

          // Animation
          const totalLength = path.node()?.getTotalLength() || 0;
          path
            .attr('stroke-dasharray', totalLength + ' ' + totalLength)
            .attr('stroke-dashoffset', totalLength);

          gsap.to(path.node(), {
            strokeDashoffset: 0,
            duration: animationDuration,
            ease: 'power2.out',
            delay: datasetIndex * 0.3,
          });

          // Points for each line
          const dots = g
            .selectAll(`.dot-${datasetIndex}`)
            .data(lineData)
            .enter()
            .append('circle')
            .attr('class', `dot-${datasetIndex}`)
            .attr('cx', (d) => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
            .attr('cy', (d) => yScale(d.value))
            .attr('r', 0)
            .attr('fill', colors[datasetIndex % colors.length]);

          gsap.to(dots.nodes(), {
            attr: { r: 4 },
            duration: 0.6,
            stagger: 0.2,
            ease: 'back.out(1.7)',
            delay: animationDuration * 0.75 + datasetIndex * 0.2,
          });
        });
      } else {
        // Single line chart
        const lineGenerator = line<LineData>()
          .x((d) => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
          .y((d) => yScale(d.value))
          .curve(curveMonotoneX);

        const path = g
          .append('path')
          .datum(singleData)
          .attr('fill', 'none')
          .attr('stroke', colors[0])
          .attr('stroke-width', 2)
          .attr('d', lineGenerator);

        // Animation
        const totalLength = path.node()?.getTotalLength() || 0;
        path
          .attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength);

        gsap.to(path.node(), {
          strokeDashoffset: 0,
          duration: animationDuration,
          ease: 'power2.out',
        });

        // Points
        const dots = g
          .selectAll('.dot')
          .data(singleData)
          .enter()
          .append('circle')
          .attr('class', 'dot')
          .attr('cx', (d: LineData) => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
          .attr('cy', (d: LineData) => yScale(d.value))
          .attr('r', 0)
          .attr('fill', colors[0]);

        gsap.to(dots.nodes(), {
          attr: { r: 4 },
          duration: 0.6,
          stagger: 0.2,
          ease: 'back.out(1.7)',
          delay: animationDuration * 0.75,
        });
      }
    } else {
      // Bar chart
      if (isMultiLine) {
        // Multi-dataset bar chart (grouped bars)
        const datasets = multiData[0]?.datasets || [];
        const barWidth = xScale.bandwidth() / datasets.length;

        datasets.forEach((_, datasetIndex) => {
          const bars = g
            .selectAll(`.bar-${datasetIndex}`)
            .data(multiData)
            .enter()
            .append('rect')
            .attr('class', `bar-${datasetIndex}`)
            .attr('x', (d) => (xScale(d.label) || 0) + datasetIndex * barWidth)
            .attr('width', barWidth)
            .attr('y', innerHeight)
            .attr('height', 0)
            .attr('fill', colors[datasetIndex % colors.length]);

          gsap.to(bars.nodes(), {
            attr: {
              y: (i: number) => yScale(multiData[i].datasets[datasetIndex]?.value || 0),
              height: (i: number) =>
                innerHeight - yScale(multiData[i].datasets[datasetIndex]?.value || 0),
            },
            duration: animationDuration,
            stagger: 0.1,
            ease: 'power2.out',
            delay: datasetIndex * 0.2,
          });
        });
      } else {
        // Single dataset bar chart
        const bars = g
          .selectAll('.bar')
          .data(singleData)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', (d: LineData) => xScale(d.label) || 0)
          .attr('width', xScale.bandwidth())
          .attr('y', innerHeight)
          .attr('height', 0)
          .attr('fill', (_d: LineData, i: number) => colors[i % colors.length]);

        gsap.to(bars.nodes(), {
          attr: {
            y: (i: number) => yScale(singleData[i].value),
            height: (i: number) => innerHeight - yScale(singleData[i].value),
          },
          duration: animationDuration,
          stagger: 0.1,
          ease: 'power2.out',
        });
      }
    }
  };

  const renderPieChart = (
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    chartData: PieData[],
    chartWidth: number,
    chartHeight: number,
    isMobile: boolean
  ) => {
    const radius = Math.min(chartWidth, chartHeight) / 2 - (isMobile ? 30 : 40);

    const g = svg
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .append('g')
      .attr('transform', `translate(${chartWidth / 2},${chartHeight / 2})`);

    const color = scaleOrdinal(colors);
    const pieGenerator = pie<PieData>().value((d) => d.value);
    const arc = d3Arc<PieArcDatum<PieData>>().innerRadius(0).outerRadius(radius);

    const arcs = g
      .selectAll('.arc')
      .data(pieGenerator(chartData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    const paths = arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (_d: PieArcDatum<PieData>, i: number) => color(i.toString()))
      .attr('opacity', 0);

    gsap.to(paths.nodes(), {
      opacity: 1,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out',
    });

    gsap.fromTo(
      paths.nodes(),
      { transformOrigin: 'center', scale: 0 },
      {
        scale: 1,
        duration: 1,
        stagger: 0.15,
        ease: 'back.out(1.7)',
      }
    );

    // Labels - Always show, with text adapted according to device
    const texts = arcs
      .append('text')
      .attr('transform', (d: PieArcDatum<PieData>) => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .style('font-size', isMobile ? '10px' : '12px')
      .style('fill', 'white')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .text((d: PieArcDatum<PieData>) => {
        // On mobile only the value, on desktop the full name
        if (isMobile) {
          return `${d.data.value}`;
        } else {
          // On desktop, if text is too long, use only the value
          const fullText = `${d.data.name}: ${d.data.value}`;
          return fullText.length > 15 ? `${d.data.value}` : fullText;
        }
      });

    gsap.to(texts.nodes(), {
      opacity: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      delay: 0.8,
    });
  };

  // Helper function to get datasets from multiline data
  const getDatasets = () => {
    if (type === 'pie') return [];
    const chartData = data as LineData[] | MultiLineData[];
    const isMultiLine = chartData.length > 0 && 'datasets' in chartData[0];
    if (isMultiLine) {
      const multiData = chartData as MultiLineData[];
      return multiData[0]?.datasets || [];
    }
    return [];
  };

  const datasets = getDatasets();
  const isMultiLineData = datasets.length > 0;

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
      {title && <h2 className="text-lg md:text-xl font-semibold mb-4">{title}</h2>}
      <div ref={containerRef} className="flex justify-center overflow-hidden">
        <svg ref={chartRef}></svg>
      </div>

      {/* Mobile legend for pie charts */}
      {type === 'pie' && shouldShowLegend && (
        <div className="block sm:hidden mt-4 text-xs text-center space-y-1">
          {(data as PieData[]).map((item, index) => (
            <div key={item.name} className="flex items-center justify-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span>
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Desktop legend for pie charts */}
      {type === 'pie' && shouldShowLegend && (
        <div className="hidden sm:block mt-4 text-sm">
          <div className="flex flex-wrap justify-center gap-4">
            {(data as PieData[]).map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span>
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile legend for multi-line/multi-bar charts */}
      {isMultiLineData && (
        <div className="block sm:hidden mt-4 text-xs text-center space-y-1">
          {datasets.map((dataset, index) => (
            <div key={dataset.name} className="flex items-center justify-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span>{dataset.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Desktop legend for multi-line/multi-bar charts */}
      {isMultiLineData && (
        <div className="hidden sm:block mt-4 text-sm">
          <div className="flex flex-wrap justify-center gap-4">
            {datasets.map((dataset, index) => (
              <div key={dataset.name} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span>{dataset.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
