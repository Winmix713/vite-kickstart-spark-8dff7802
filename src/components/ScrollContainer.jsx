import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';
import theme from 'styled-theming';
import PropTypes from 'prop-types';
import classNames from 'classnames';

// hooks
import useElementScroll from '@hooks/useElementScroll';

// Constants
const GRADIENT_HEIGHTS = {
  default: 100,
  compact: 40,
};

const THEMES = {
  light: {
    gradient: 'linear-gradient(180deg, rgba(255, 255, 255, 0.0001) 0%, #ffffff 100%)',
  },
  dark: {
    gradient: 'linear-gradient(180deg, rgba(17, 19, 18, 0.0001) 0%, #111312 100%)',
  },
};

// Styled Components
const ScrollerWrapper = styled.div`
  height: ${({ $heightOffset }) => $heightOffset ? `calc(100% - ${$heightOffset}px)` : '100%'};
  position: relative;
  flex-grow: 1;
  width: 100%;
  overflow: hidden;

  &.has-overflow {
    &::before,
    &::after {
      content: '';
      display: block;
      height: ${({ $gradientHeight }) => $gradientHeight}px;
      position: absolute;
      width: 100%;
      left: 0;
      right: 0;
      z-index: 300;
      pointer-events: none;
      transition: height var(--transition, 0.3s ease-in-out),
                  opacity var(--transition, 0.3s ease-in-out);
      background: ${theme('theme', {
        light: THEMES.light.gradient,
        dark: THEMES.dark.gradient,
      })};
      opacity: 1;
    }

    &::before {
      top: 0;
      transform: scaleY(-1);
    }

    &::after {
      bottom: 0;
    }

    &.is-top::before,
    &.is-bottom::after {
      height: 0;
      opacity: 0;
    }
  }
`;

const ScrollTrack = styled.div`
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: ${({ $smoothScroll }) => $smoothScroll ? 'smooth' : 'auto'};
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: ${({ $scrollbarWidth }) => $scrollbarWidth}px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${theme('theme', {
      light: 'rgba(0, 0, 0, 0.2)',
      dark: 'rgba(255, 255, 255, 0.2)',
    })};
    border-radius: ${({ $scrollbarWidth }) => $scrollbarWidth / 2}px;
    transition: background var(--transition, 0.3s ease-in-out);

    &:hover {
      background: ${theme('theme', {
        light: 'rgba(0, 0, 0, 0.3)',
        dark: 'rgba(255, 255, 255, 0.3)',
      })};
    }
  }

  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: ${theme('theme', {
    light: 'rgba(0, 0, 0, 0.2) transparent',
    dark: 'rgba(255, 255, 255, 0.2) transparent',
  })};
`;

const ScrollContent = styled.div`
  padding: ${({ $contentPadding }) => $contentPadding};
  min-height: ${({ $minHeight }) => $minHeight || 'auto'};
`;

/**
 * ScrollContainer - Advanced scrollable container with gradient fade effects
 * 
 * Features:
 * - Automatic gradient overlays when content overflows
 * - Customizable gradient heights for compact/default modes
 * - Smooth scroll behavior option
 * - Custom scrollbar styling
 * - Accessibility support
 * - Performance optimized with useMemo
 * 
 * @component
 * @example
 * <ScrollContainer height={60} isCompact>
 *   <YourContent />
 * </ScrollContainer>
 */
const ScrollContainer = ({
  children,
  height = 0,
  isCompact = false,
  smoothScroll = false,
  scrollbarWidth = 8,
  contentPadding = '0',
  minHeight = null,
  className = '',
  onScroll = null,
  testId = 'scroll-container',
}) => {
  const { ref, isOverflown, isTop, isBottom } = useElementScroll();

  // Memoized values
  const gradientHeight = useMemo(
    () => isCompact ? GRADIENT_HEIGHTS.compact : GRADIENT_HEIGHTS.default,
    [isCompact]
  );

  const containerClasses = useMemo(
    () => classNames(
      {
        'has-overflow': isOverflown,
        'is-top': isTop,
        'is-bottom': isBottom,
      },
      className
    ),
    [isOverflown, isTop, isBottom, className]
  );

  // Scroll handler
  const handleScroll = useCallback(
    (event) => {
      if (onScroll && typeof onScroll === 'function') {
        onScroll(event);
      }
    },
    [onScroll]
  );

  return (
    <ScrollerWrapper
      className={containerClasses}
      $heightOffset={height}
      $gradientHeight={gradientHeight}
      data-testid={testId}
      role="region"
      aria-label="Scrollable content"
    >
      <ScrollTrack
        ref={ref}
        onScroll={handleScroll}
        $smoothScroll={smoothScroll}
        $scrollbarWidth={scrollbarWidth}
      >
        <ScrollContent
          $contentPadding={contentPadding}
          $minHeight={minHeight}
        >
          {children}
        </ScrollContent>
      </ScrollTrack>
    </ScrollerWrapper>
  );
};

ScrollContainer.propTypes = {
  /** Content to be rendered inside the scroll container */
  children: PropTypes.node.isRequired,
  
  /** Height offset to subtract from 100% */
  height: PropTypes.number,
  
  /** Compact mode with smaller gradient overlays */
  isCompact: PropTypes.bool,
  
  /** Enable smooth scrolling behavior */
  smoothScroll: PropTypes.bool,
  
  /** Width of the scrollbar in pixels */
  scrollbarWidth: PropTypes.number,
  
  /** Padding for the content wrapper */
  contentPadding: PropTypes.string,
  
  /** Minimum height for the content area */
  minHeight: PropTypes.string,
  
  /** Additional CSS class names */
  className: PropTypes.string,
  
  /** Callback function triggered on scroll */
  onScroll: PropTypes.func,
  
  /** Test ID for testing libraries */
  testId: PropTypes.string,
};

export default ScrollContainer;