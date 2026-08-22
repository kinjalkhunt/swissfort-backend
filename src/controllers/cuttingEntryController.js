// import * as cuttingService
//     from '../services/cuttingService.js';


// // ============================================
// // GET NEXT TRN
// // ============================================

// export const getNextTrnNo = async (
//     req,
//     res,
//     next
// ) => {
//     try {

//         const trnNo =
//             await cuttingService
//                 .getNextCuttingTrnNo();

//         res.status(200).json({
//             success: true,
//             data: {
//                 trnNo,
//             },
//         });

//     } catch (error) {
//         next(error);
//     }
// };


// // ============================================
// // GET SKU DETAILS
// // ============================================

// export const getSkuDetails = async (
//     req,
//     res,
//     next
// ) => {
//     try {

//         const { skuNo } = req.params;

//         const data =
//             await cuttingService
//                 .getSkuDetails(skuNo);

//         res.status(200).json({
//             success: true,
//             data,
//         });

//     } catch (error) {
//         next(error);
//     }
// };


// // ============================================
// // GET PRODUCTS
// // ============================================

// export const getProducts = async (
//     req,
//     res,
//     next
// ) => {
//     try {

//         const products =
//             await cuttingService
//                 .getProducts();

//         res.status(200).json({
//             success: true,
//             count: products.length,
//             data: products,
//         });

//     } catch (error) {
//         next(error);
//     }
// };


// // ============================================
// // GET PRODUCT BY ID
// // ============================================

// export const getProductById = async (
//     req,
//     res,
//     next
// ) => {
//     try {

//         const product =
//             await cuttingService
//                 .getProductById(
//                     req.params.id
//                 );

//         res.status(200).json({
//             success: true,
//             data: product,
//         });

//     } catch (error) {
//         next(error);
//     }
// };


// // ============================================
// // CREATE
// // ============================================

// export const createCuttingEntry = async (
//     req,
//     res,
//     next
// ) => {
//     try {

//         const entry =
//             await cuttingService
//                 .createCuttingEntry(req.body);

//         res.status(201).json({
//             success: true,
//             message:
//                 'Cutting entry created successfully',
//             data: entry,
//         });

//     } catch (error) {
//         next(error);
//     }
// };


// // ============================================
// // GET ALL
// // ============================================

// export const getAllCuttingEntries = async (
//     req,
//     res,
//     next
// ) => {
//     try {

//         const result =
//             await cuttingService
//                 .getAllCuttingEntries(
//                     req.query
//                 );

//         res.status(200).json({
//             success: true,
//             ...result,
//         });

//     } catch (error) {
//         next(error);
//     }
// };


// // ============================================
// // GET BY ID
// // ============================================

// export const getCuttingEntryById = async (
//     req,
//     res,
//     next
// ) => {
//     try {

//         const entry =
//             await cuttingService
//                 .getCuttingEntryById(
//                     req.params.id
//                 );

//         res.status(200).json({
//             success: true,
//             data: entry,
//         });

//     } catch (error) {
//         next(error);
//     }
// };


// // ============================================
// // UPDATE
// // ============================================

// export const updateCuttingEntry = async (
//     req,
//     res,
//     next
// ) => {
//     try {

//         const entry =
//             await cuttingService
//                 .updateCuttingEntry(
//                     req.params.id,
//                     req.body
//                 );

//         res.status(200).json({
//             success: true,
//             message:
//                 'Cutting entry updated successfully',
//             data: entry,
//         });

//     } catch (error) {
//         next(error);
//     }
// };


// // ============================================
// // DELETE
// // ============================================

// export const deleteCuttingEntry = async (
//     req,
//     res,
//     next
// ) => {
//     try {

//         await cuttingService
//             .deleteCuttingEntry(
//                 req.params.id
//             );

//         res.status(200).json({
//             success: true,
//             message:
//                 'Cutting entry deleted successfully',
//         });

//     } catch (error) {
//         next(error);
//     }
// };


import * as cuttingService from '../services/cuttingService.js';

// // ============================================
// // GET NEXT TRN
// // ============================================

// export const getNextTrnNo = async (req, res, next) => {
//     try {
//         const trnNo = await cuttingService.getNextCuttingTrnNo();
//         res.status(200).json({
//             success: true,
//             data: { trnNo },
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // ============================================
// // GET SKU DETAILS
// // ============================================

// export const getSkuDetails = async (req, res, next) => {
//     try {
//         const { skuNo } = req.params;
//         const data = await cuttingService.getSkuDetails(skuNo);
//         res.status(200).json({
//             success: true,
//             data,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // ============================================
// // GET PRODUCTS
// // ============================================

// export const getProducts = async (req, res, next) => {
//     try {
//         const products = await cuttingService.getProducts();
//         res.status(200).json({
//             success: true,
//             count: products.length,
//             data: products,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // ============================================
// // GET PRODUCT BY ID
// // ============================================

// export const getProductById = async (req, res, next) => {
//     try {
//         const product = await cuttingService.getProductById(req.params.id);
//         res.status(200).json({
//             success: true,
//             data: product,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // ============================================
// // CREATE
// // ============================================

// export const createCuttingEntry = async (req, res, next) => {
//     try {
//         const entry = await cuttingService.createCuttingEntry(req.body);
//         res.status(201).json({
//             success: true,
//             message: 'Cutting entry created successfully',
//             data: entry,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // ============================================
// // GET ALL
// // ============================================

// export const getAllCuttingEntries = async (req, res, next) => {
//     try {
//         const result = await cuttingService.getAllCuttingEntries(req.query);
//         res.status(200).json({
//             success: true,
//             ...result,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // ============================================
// // GET BY ID
// // ============================================

// export const getCuttingEntryById = async (req, res, next) => {
//     try {
//         const entry = await cuttingService.getCuttingEntryById(req.params.id);
//         res.status(200).json({
//             success: true,
//             data: entry,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // ============================================
// // UPDATE
// // ============================================

// export const updateCuttingEntry = async (req, res, next) => {
//     try {
//         if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Request body must be valid JSON.',
//             });
//         }

//         const entry = await cuttingService.updateCuttingEntry(
//             req.params.id,
//             req.body
//         );
//         res.status(200).json({
//             success: true,
//             message: 'Cutting entry updated successfully',
//             data: entry,
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// // ============================================
// // DELETE
// // ============================================

// export const deleteCuttingEntry = async (req, res, next) => {
//     try {
//         await cuttingService.deleteCuttingEntry(req.params.id);
//         res.status(200).json({
//             success: true,
//             message: 'Cutting entry deleted successfully',
//         });
//     } catch (error) {
//         next(error);
//     }
// };



// ============================================
// GET NEXT TRN
// ============================================
export const getNextTrnNo = async (req, res, next) => {
    try {
        const trnNo = await cuttingService.getNextCuttingTrnNo();
        res.status(200).json({
            success: true,
            data: { trnNo },
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET SKU DETAILS
// ============================================
export const getSkuDetails = async (req, res, next) => {
    try {
        const { skuNo } = req.params;
        const data = await cuttingService.getSkuDetails(skuNo);
        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET SKU STOCK HISTORY
// ============================================
export const getSkuStockHistory = async (req, res, next) => {
    try {
        const { skuNo } = req.params;
        const data = await cuttingService.getSkuStockHistory(skuNo);
        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET PRODUCTS
// ============================================
export const getProducts = async (req, res, next) => {
    try {
        const products = await cuttingService.getProducts();
        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET PRODUCT BY ID
// ============================================
export const getProductById = async (req, res, next) => {
    try {
        const product = await cuttingService.getProductById(req.params.id);
        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// CREATE
// ============================================
export const createCuttingEntry = async (req, res, next) => {
    try {
        const entry = await cuttingService.createCuttingEntry(req.body);
        res.status(201).json({
            success: true,
            message: 'Cutting entry created successfully',
            data: entry,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET ALL
// ============================================
export const getAllCuttingEntries = async (req, res, next) => {
    try {
        const result = await cuttingService.getAllCuttingEntries(req.query);
        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// GET BY ID
// ============================================
export const getCuttingEntryById = async (req, res, next) => {
    try {
        const entry = await cuttingService.getCuttingEntryById(req.params.id);
        res.status(200).json({
            success: true,
            data: entry,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// UPDATE
// ============================================
export const updateCuttingEntry = async (req, res, next) => {
    try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({
                success: false,
                message: 'Request body must be valid JSON.',
            });
        }

        const entry = await cuttingService.updateCuttingEntry(
            req.params.id,
            req.body
        );
        res.status(200).json({
            success: true,
            message: 'Cutting entry updated successfully',
            data: entry,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// DELETE
// ============================================
export const deleteCuttingEntry = async (req, res, next) => {
    try {
        await cuttingService.deleteCuttingEntry(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Cutting entry deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};