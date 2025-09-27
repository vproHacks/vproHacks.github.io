---
title: "Projects"
permalink: /categories/projects/
layout: archive
author_profile: true
---

<div class="category-header">
  <h1>Technical Projects</h1>
  <p>A collection of my engineering projects, research work, and technical implementations spanning hardware design, software development, and AI systems.</p>
</div>

<!-- Display posts from the 'projects' category -->
{% for post in site.categories.projects %}
  {% include archive-single.html %}
{% endfor %}

{% include paginator.html %}
