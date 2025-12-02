"use client";

if (typeof window !== 'undefined') {
  window.global = window;
  window.process = window.process || require('process');
  window.Buffer = window.Buffer || require('buffer').Buffer;
}
