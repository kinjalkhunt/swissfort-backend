import * as productService from '../services/productService.js';

// Get all products
export const getAllProducts = async (req, res, next) => {
  try {
    const { search, productType } = req.query;

    const products = await productService.getAllProducts({
      search,
      productType,
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get product by ID
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Get product by code
export const getProductByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const product = await productService.getProductByCode(code);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Create new product
export const createProduct = async (req, res, next) => {
  try {
    const { productName, productType } = req.body;

    // Validation
    if (!productName || !productType) {
      return res.status(400).json({
        success: false,
        message: 'Product name and product type are required',
      });
    }

    const product = await productService.createProduct({
      productName,
      productType,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Update product
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productName, productType } = req.body;

    if (!productName && !productType) {
      return res.status(400).json({
        success: false,
        message: 'At least one field is required to update',
      });
    }

    const updatedProduct = await productService.updateProduct(id, {
      productName,
      productType,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Delete product
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get product stats
export const getProductStats = async (req, res, next) => {
  try {
    const stats = await productService.getProductStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};