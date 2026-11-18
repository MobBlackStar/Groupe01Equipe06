import React, { createContext, useContext } from 'react';
import { use3DTilt } from './use3DTilt.js';

const DepthContext = createContext({ isHovered: false, motionDisabled: false });

/**
 * DepthLayer - Sub-element inside DepthCard that projects into 3D z-space.
 *
 * @param {Object} props
 * @param {number} [props.depth=20] translateZ offset in pixels (e.g. 15, 30, 45)
 * @param {boolean} [props.shadow=false] Whether to add dynamic 3D drop shadow
 * @param {string} [props.className='']
 * @param {React.ReactNode} props.children
 */
export function DepthLayer({
  depth = 20,
  shadow = false,
  className = '',
  style = {},
  children,
  ...rest
}) {
  const { motionDisabled, isHovered } = useContext(DepthContext);

  const layerStyle = motionDisabled
    ? style
    : {
        transform: `translateZ(${depth}px)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease',
        filter:
          shadow && !motionDisabled && isHovered
            ? `drop-shadow(0 ${Math.round(depth * 0.45)}px ${Math.round(depth * 0.6)}px rgba(0,0,0,${Math.min(0.5, 0.2 + depth * 0.005)}))`
            : shadow
            ? `drop-shadow(0 ${Math.round(depth * 0.2)}px ${Math.round(depth * 0.3)}px rgba(0,0,0,0.2))`
            : 'none',
        ...style,
      };

  return (
    <div className={`relative ${className}`} style={layerStyle} {...rest}>
      {children}
    </div>
  );
}

/**
 * DepthCard - Multi-layer 3D tilt container.
 *
 * Features:
 * - Silky smooth mouse tracking tilt with spring damping (use3DTilt)
 * - Dynamic specular glare overlay
 * - preserve-3d coordinate space for nested floating layers
 * - Accessible and touch-safe fallback
 */
export function DepthCard({
  children,
  className = '',
  style = {},
  maxTilt = 14,
  perspective = 1100,
  scale = 1.02,
  damping = 0.16,
  glare = true,
  maxGlare = 0.3,
  reverse = false,
  disabled = false,
  onClick,
  ...rest
}) {
  const { ref, style: tiltStyle, glareStyle, isHovered, motionDisabled, handlers } = use3DTilt({
    maxTilt,
    perspective,
    scale,
    damping,
    glare,
    maxGlare,
    reverse,
    disabled,
  });

  return (
    <DepthContext.Provider value={{ isHovered, motionDisabled }}>
      <div
        ref={ref}
        style={{
          ...tiltStyle,
          ...style,
        }}
        {...handlers}
        onClick={onClick}
        className={`relative group select-none ${className}`}
        {...rest}
      >
        {children}

        {/* Dynamic Specular Glare Reflection */}
        {glare && !motionDisabled && (
          <div
            aria-hidden="true"
            style={glareStyle}
            className="overflow-hidden rounded-inherit pointer-events-none transition-opacity duration-300"
          />
        )}
      </div>
    </DepthContext.Provider>
  );
}

// Attach subcomponents for compound syntax: <DepthCard.Layer depth={30}>
DepthCard.Layer = DepthLayer;
DepthCard.Floating = function DepthFloating({
  depth = 30,
  shadow = true,
  className = '',
  children,
  ...props
}) {
  return (
    <DepthLayer depth={depth} shadow={shadow} className={`z-10 ${className}`} {...props}>
      {children}
    </DepthLayer>
  );
};

export default DepthCard;
