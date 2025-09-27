---
title: "Blog"
permalink: /categories/blog/
layout: archive
author_profile: true
---

<div class="category-header">
  <h1>Blog Posts</h1>
  <p>Personal reflections, insights, and thoughts on engineering education, career development, and the intersection of technology and society.</p>
</div>

{% for post in site.categories.blog %}
  {% include archive-single.html %}
{% endfor %}

{% include paginator.html %}
