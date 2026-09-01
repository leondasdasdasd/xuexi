import PropTypes from "prop-types";

export const pointShape = PropTypes.shape({
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
});

export const sizeShape = PropTypes.shape({
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
});

export const polygonShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  category: PropTypes.string,
  color: PropTypes.string,
  points: PropTypes.arrayOf(pointShape),
  ratioPoints: PropTypes.arrayOf(pointShape),
});

export const categoryShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string,
    color: PropTypes.string,
  }),
]);

export const normalizedCategoryShape = PropTypes.shape({
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
});

export const categoryMapShape = PropTypes.objectOf(normalizedCategoryShape);
