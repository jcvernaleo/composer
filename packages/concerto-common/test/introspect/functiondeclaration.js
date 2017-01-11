/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const FunctionDeclaration = require('../../lib/introspect/functiondeclaration');
const Script = require('../../lib/introspect/script');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');

require('chai').should();
const sinon = require('sinon');

describe('FunctionDeclaration', () => {

    const modelManager = new ModelManager();
    modelManager.addModelFile('namespace org.acme transaction TestTransaction identified by id {o String id}');
    let mozartModel = fs.readFileSync('test/data/model/mozart.cto', 'utf8');
    modelManager.addModelFile(mozartModel);

    let loadFunctionDeclaration = (scriptFileName) => {
        let scriptText = fs.readFileSync(scriptFileName, 'utf8');
        let script = new Script(modelManager, 'TEST_SCRIPT', 'JS', scriptText);
        let functions = script.getFunctionDeclarations();
        (functions.length > 0).should.be.true;
        return functions[0];
    };

    describe('#constructor', () => {

        it('should throw if modelManager not specified', () => {
            (() => {
                new FunctionDeclaration(null, {});
            }).should.throw(/required/);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.js');
            let visitor = {
                visit: sinon.stub()
            };
            func.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, func, ['some', 'args']);
        });

    });

    describe('#getName', () => {

        it('should return the function name', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.js');
            func.getName().should.equal('onTestTransaction');
        });

    });

    describe('#getFunctionText', () => {

        it('should return the function text', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.js');
            func.getFunctionText().should.match(/^function onTestTransaction\(testTransaction\)/);
        });

    });

    describe('#getDecorators', () => {

        it('should return the function decorators', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.js');
            func.getDecorators().should.deep.equal(['param', 'transaction']);
        });

    });

    describe('#getParameters', () => {

        it('should return the function parameters', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.js');
            func.getParameterNames().should.deep.equal(['testTransaction']);
        });

    });

    describe('#getTransactionDeclarationName', () => {

        it('should return the transaction name', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.js');
            func.getTransactionDeclarationName().should.equal('TestTransaction');
        });

    });

    describe('#getFullyQualifiedName', () => {

        it('should return the fully qualified name if function is in a namespace', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.js');
            func.getName().should.equal('onTestTransaction');
        });

    });

    describe('#getDecorators', () => {

        it('should grab all decorators', () => {
            let func = loadFunctionDeclaration('test/data/model/mozart.cto.js');
            func.getDecorators().should.deep.equal(['param', 'transaction']);
        });
    });

    describe('#validate', () => {

        it('should throw if the function refers to a transaction that does not exist', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.missingtx.js');
                func.validate();
            }).should.throw(/No type org.acme.TestTransactionLulz/);
        });

        it('should throw if the function refers to a transaction that is not a transaction', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.notatx.js');
                func.validate();
            }).should.throw(/is not a transaction/);
        });

        it('should throw if the function is decorated with both @transaction and @query', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.queryandtransaction.js');
                func.validate();
            }).should.throw(/cannot be decorated with both/);
        });

        it('should throw if first brace around param type is missing', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.missingfirstbrace.js');
                func.validate();
            }).should.throw(/Malformed JSDoc comment/);
        });

        it('should throw if second brace around param type is missing', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.missingsecondbrace.js');
                func.validate();
            }).should.throw(/Malformed JSDoc comment/);
        });

        it('should throw if second brace around param type is missing', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.typenametogether.js');
                func.validate();
            }).should.throw(/Malformed JSDoc comment/);
        });

        it('should throw if both braces around param type are missing', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.bracesmissing.js');
                func.validate();
            }).should.throw(/Malformed JSDoc comment/);
        });

        it('should throw if param name is missing', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.missingname.js');
                func.validate();
            }).should.throw(/Malformed JSDoc comment/);
        });

        it('should throw if param type is missing', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.missingtype.js');
                func.validate();
            }).should.throw(/Malformed JSDoc comment/);
        });

        it('should throw if @throws and @exception are both specified', () => {
            (() => {
                let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.throwsexception.js');
                func.validate();
            }).should.throw(/Malformed JSDoc comment/);
        });

        it('should not throw if spaces are placed in front of the param type', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.spaces.js');
            func.getDecorators().should.deep.equal(['param', 'transaction']);
            func.parameterTypes.should.deep.equal(['org.acme.TestTransaction']);
        });

        it('should throw if @transaction isn\'t specified and the function is a transaction function');
    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            let func = loadFunctionDeclaration('test/data/parser/functiondeclaration.good.js');
            let jsonObject = func.toJSON();
            jsonObject.should.deep.equal({});
        });

    });

});