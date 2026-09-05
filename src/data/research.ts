export interface ResearchPaper {
  id: string
  title: string
  authors: string
  year: number
  journal: string
  /** e.g. 'Meta-analysis' | 'Systematic review' | 'Randomized controlled' ... */
  type: string
  summary: string
  doi?: string
  url?: string
}

/**
 * The six core references grounding the app's design defaults.
 * Summaries are condensed from appspec.md §3; full citations there.
 */
export const RESEARCH_PAPERS: ResearchPaper[] = [
  {
    id: 'garcia-argibay-2019',
    title:
      'Efficacy of binaural auditory beats in cognition, anxiety, and pain perception: a meta-analysis',
    authors: 'Garcia-Argibay, M., Santed, M. A., & Reales, J. M.',
    year: 2019,
    journal: 'Psychological Research',
    type: 'Meta-analysis',
    summary:
      'Pooled 22 studies: binaural beats were associated with significant reductions in state anxiety, pain attenuation, and modest gains in attention, working memory, and long-term memory. Effects were frequency-specific — there is no single "relaxation" outcome.',
    doi: '10.1007/s00426-018-1066-8',
  },
  {
    id: 'ingendoh-2023',
    title:
      'Binaural beats to entrain the brain? A systematic review of the effects on brain oscillatory activity',
    authors: 'Ingendoh, R. M., Posny, E. S., & Heine, A.',
    year: 2023,
    journal: 'PLoS ONE',
    type: 'Systematic review',
    summary:
      'Of 14 EEG studies, only 5 supported scalp-level entrainment to the beat, 8 contradicted it, and 1 was mixed. Subcortical frequency-following responses (FFR/ASSR) are robust, but global cortical entrainment is inconsistent; many benefits may act via autonomic modulation and masking.',
    doi: '10.1371/journal.pone.0286023',
  },
  {
    id: 'papalambros-2017',
    title:
      'Acoustic enhancement of sleep slow oscillations and concomitant memory improvement in older adults',
    authors: 'Papalambros, N. A., Santostasi, G., Malkani, R. G., et al.',
    year: 2017,
    journal: 'Frontiers in Human Neuroscience',
    type: 'Randomized within-subject',
    summary:
      '13 older adults heard closed-loop pink-noise pulses phase-locked to their own slow waves during sleep. Slow-wave and spindle activity rose in the ON windows and overnight word-pair memory improved ~3× vs. sham. Requires EEG — a consumer app cannot replicate the closed loop.',
    doi: '10.3389/fnhum.2017.00109',
  },
  {
    id: 'adaikkan-2019',
    title: 'Gamma Entrainment Binds Higher-Order Brain Regions and Offers Neuroprotection',
    authors: 'Adaikkan, C., Middleton, S. J., Marco, A., et al.',
    year: 2019,
    journal: 'Neuron',
    type: 'Preclinical (mouse)',
    summary:
      "In Alzheimer's-model mice, 1 h/day of 40 Hz sensory flicker (GENUS) entrained gamma, reduced neuronal/synaptic loss, and shifted microglia toward a protective profile, suggesting 40 Hz stimulation may be neuroprotective. Preclinical only — human clinical benefit is unproven.",
    doi: '10.1016/j.neuron.2019.04.011',
  },
  {
    id: 'linkenkaer-hansen-2001',
    title: 'Long-range temporal correlations and scaling behavior in human brain oscillations',
    authors: 'Linkenkaer-Hansen, K., Nikulin, V. V., Palva, J. M., & Ilmoniemi, R. J.',
    year: 2001,
    journal: 'Journal of Neuroscience',
    type: 'Experimental',
    summary:
      'Resting human MEG/EEG shows power-law (1/f^β) scaling of oscillation amplitude, β ≈ 0.5–1.0 — close to pink noise. This is the canonical support for using pink (1/f) rather than white noise as a spectrally-neutral mask.',
    doi: '10.1523/JNEUROSCI.21-04-01370.2001',
  },
  {
    id: 'oster-1973',
    title: 'Auditory beats in the brain',
    authors: 'Oster, G.',
    year: 1973,
    journal: 'Scientific American',
    type: 'Foundational essay',
    summary:
      'The original modern account of binaural beats: they are neurally generated in the brainstem (superior olivary complex), require separate ears, are best perceived with ~200–500 Hz carriers, and vanish above ~1000 Hz. Framed as a research/diagnostic tool, not a therapy.',
    url: 'https://archive.org/details/magazine-article-1973-scientific-american-auditory-beats-in-the-brain-gerald-oster',
  },
]
