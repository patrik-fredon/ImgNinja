"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  rating: number;
  avatar?: string;
  verified?: boolean;
}

interface TestimonialsProps {
  variant?: "carousel" | "grid" | "single";
  showRating?: boolean;
  autoRotate?: boolean;
  className?: string;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Web Developer",
    company: "TechCorp",
    content:
      "ImgNinja saved me hours of work! Converting images to WebP has never been easier. The quality is perfect and it's completely free.",
    rating: 5,
    verified: true,
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Digital Designer",
    company: "Creative Studio",
    content:
      "I love how fast and reliable this tool is. The batch conversion feature is a game-changer for my workflow.",
    rating: 5,
    verified: true,
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    role: "E-commerce Manager",
    content:
      "Perfect for optimizing product images. The file size reduction is incredible while maintaining quality.",
    rating: 5,
    verified: true,
  },
  {
    id: "4",
    name: "David Kim",
    role: "Blogger",
    content:
      "As a blogger, I need to optimize images constantly. ImgNinja makes it so simple and the results are always great.",
    rating: 5,
    verified: true,
  },
  {
    id: "5",
    name: "Anna Kowalski",
    role: "Photographer",
    content:
      "Great tool for quick format conversions. The privacy aspect is important to me - no uploads needed!",
    rating: 5,
    verified: true,
  },
  {
    id: "6",
    name: "James Wilson",
    role: "Marketing Specialist",
    content:
      "Excellent for social media content creation. The quality presets make it easy to get the right output every time.",
    rating: 5,
    verified: true,
  },
];

export function Testimonials({
  variant = "carousel",
  showRating = true,
  autoRotate = true,
  className = "",
}: TestimonialsProps) {
  const t = useTranslations("testimonials");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoRotate || variant !== "carousel") return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRotate, variant]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const renderTestimonial = (testimonial: Testimonial, index?: number) => (
    <div key={testimonial.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-brand rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0">
          {testimonial.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
            {testimonial.verified && (
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {testimonial.role}
            {testimonial.company && ` at ${testimonial.company}`}
          </p>
          {showRating && (
            <div className="flex items-center gap-1 mb-3">{renderStars(testimonial.rating)}</div>
          )}
          <p className="text-gray-700 italic">"{testimonial.content}"</p>
        </div>
      </div>
    </div>
  );

  if (variant === "single") {
    return <div className={className}>{renderTestimonial(testimonials[currentIndex])}</div>;
  }

  if (variant === "grid") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {testimonials.slice(0, 6).map((testimonial) => renderTestimonial(testimonial))}
      </div>
    );
  }

  // Carousel variant
  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.id} className="w-full shrink-0 px-4">
              {renderTestimonial(testimonial, index)}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-brand-600" : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() =>
          setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
        }
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % testimonials.length)}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
