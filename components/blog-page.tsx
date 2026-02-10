"use client";

import { ArrowLeft } from "lucide-react";
import { MagnifierDemo } from "@/components/liquid-glass/magnifier-demo";
import { SwitchDemo } from "@/components/liquid-glass/switch-demo";
import { SliderDemo } from "@/components/liquid-glass/slider-demo";
import { SearchDemo } from "@/components/liquid-glass/search-demo";
import { PlayerDemo } from "@/components/liquid-glass/player-demo";

const tags = [
  "WWDC 2025",
  "Apple",
  "iOS 26",
  "Liquid Glass",
  "CSS",
  "SVG",
  "Frontend",
];

export function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back link */}
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </a>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-balance">
          Implementing Apple{"'"}s Liquid Glass Effect with CSS and SVG
        </h1>

        {/* Date */}
        <time className="block text-sm text-muted-foreground mb-10">
          2025-09-16
        </time>

        {/* Introduction */}
        <article className="prose-section">
          <p className="text-base leading-relaxed text-muted-foreground mb-6">
            Apple introduced the{" "}
            <span className="text-foreground font-medium">
              Liquid Glass effect
            </span>{" "}
            at WWDC 2025 in June. While opinions have been mixed, Apple has
            historically been a trendsetter in UI design. This page recreates
            the Liquid Glass effect using CSS and SVG filter primitives {"--"}{" "}
            demonstrating interactive magnification, switches, sliders, search
            inputs, and music players.
          </p>

          <p className="text-base leading-relaxed text-muted-foreground mb-6">
            According to the developer documentation, Liquid Glass is a dynamic
            interface material that blends the optical properties of glass with a
            fluid feel. The key technique involves{" "}
            <code className="bg-secondary text-foreground px-1.5 py-0.5 rounded text-sm font-mono">
              SVG feDisplacementMap
            </code>{" "}
            filters combined with procedurally generated displacement and
            specular maps calculated using Snell{"'"}s Law of refraction.
          </p>

          {/* Compatibility notice */}
          <div className="rounded-xl border border-[rgba(102,126,234,0.3)] bg-[linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.08))] px-5 py-4 mb-10">
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5" aria-hidden="true">
                *
              </span>
              <div className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  Limited Availability:
                </span>{" "}
                Due to performance constraints, the real-time glass refraction
                effect requires advanced CSS features such as{" "}
                <code className="bg-secondary text-foreground px-1 py-0.5 rounded text-xs font-mono">
                  backdrop-filter
                </code>{" "}
                with SVG filters. This demo works best in the latest Chrome/Edge
                on desktop. A clone-based fallback is used for broader
                compatibility.
              </div>
            </div>
          </div>
        </article>

        {/* Demos */}
        <div className="flex flex-col gap-10 mb-12">
          <MagnifierDemo />
          <SwitchDemo />
          <SliderDemo />
          <SearchDemo />
          <PlayerDemo />
        </div>

        {/* Divider */}
        <hr className="border-border mb-8" />

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-10">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs font-medium rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-6 pb-12 border-t border-border">
          Built with CSS + SVG filter primitives. Inspired by Apple{"'"}s Liquid
          Glass design language.
        </footer>
      </div>
    </div>
  );
}
