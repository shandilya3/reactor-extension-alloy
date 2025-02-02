/*
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import React from "react";
import Delete from "@spectrum-icons/workflow/Delete";
import { array, string } from "yup";
import { FieldArray, useField } from "formik";
import { Flex, Radio, ActionButton, Button } from "@adobe/react-spectrum";
import PropTypes from "prop-types";
import FormikTextField from "../components/formikReactSpectrum3/formikTextField";
import FormikRadioGroup from "../components/formikReactSpectrum3/formikRadioGroup";
import DataElementSelector from "../components/dataElementSelector";
import singleDataElementRegex from "../constants/singleDataElementRegex";
import { DATA_ELEMENT_REQUIRED } from "../constants/validationErrorMessages";

const FORM = "form";
const DATA_ELEMENT = "dataElement";

/** @typedef {import("./form").Form} Form */
/**
 * This creates a form that just supports an array of strings. Any fields not
 * filled in will be removed from the array. Each item in the array can be a
 * data element or the entire array can be a data element.
 * @param {object} options - Options for the field.
 * @param {string} options.name - The formik key to use for this field.
 * - `${key}` will be used to store the array of strings.
 * - `${key}InputMethod` will be used to determine whether or not to use a data
 *   element.
 * - `${key}DataElement` will be used to store the data element value.
 * @param {string} options.label - The label to use for the field.
 * @param {string} options.singularLabel - The singular label to use for the add
 * button.
 * @param {string} [options.description] - The description to use for the field.
 * This will appear bellow the last string field.
 * @param {string} [options.dataElementDescription] - The description to use for
 * the data element field. Usually you would use this to describe the type the
 * data element should be.
 * @param {boolean} [options.isRequired] - Whether or not the field is
 * required. When required, the user will need to enter at least one string.
 * @param options.validationSchema - A yup validation schema to use for each
 * string in the array.
 * @returns {Form} A form field for an array of strings.
 */
export default function stringArray({
  name,
  isRequired = false,
  label,
  singularLabel,
  description,
  dataElementDescription,
  validationSchema
}) {
  const validationShape = {
    [name]: array()
  };
  if (isRequired) {
    validationShape[name] = validationShape[name]
      .compact()
      .when(`${name}InputMethod`, {
        is: FORM,
        then: schema =>
          schema.min(
            1,
            `Please provide at least one ${singularLabel.toLowerCase()}.`
          )
      });
  }
  if (validationSchema) {
    validationShape[name] = validationShape[name].when(`${name}InputMethod`, {
      is: FORM,
      then: schema => schema.of(validationSchema)
    });
  }
  validationShape[`${name}DataElement`] = string().when(`${name}InputMethod`, {
    is: DATA_ELEMENT,
    then: schema =>
      schema
        .matches(singleDataElementRegex, DATA_ELEMENT_REQUIRED)
        .required(DATA_ELEMENT_REQUIRED)
  });

  const part = {
    getInitialValues({ initInfo }) {
      const { [name]: value = [""] } = initInfo.settings || {};

      const initialValues = {
        [name]: value,
        [`${name}InputMethod`]: FORM,
        [`${name}DataElement`]: ""
      };

      if (typeof value === "string") {
        initialValues[name] = [""];
        initialValues[`${name}InputMethod`] = DATA_ELEMENT;
        initialValues[`${name}DataElement`] = value;
      }
      return initialValues;
    },
    getSettings({ values }) {
      const settings = {};
      if (values[`${name}InputMethod`] === FORM) {
        const filteredValues = values[name].filter(value => value);
        if (filteredValues.length > 0) {
          settings[name] = filteredValues;
        }
      } else {
        settings[name] = values[`${name}DataElement`];
      }
      return settings;
    },
    validationShape,
    Component: ({ namePrefix = "" }) => {
      const [{ value: inputMethod }] = useField(
        `${namePrefix}${name}InputMethod`
      );
      const [
        { value: items },
        { touched: itemsTouched, error: itemsError },
        { setValue: setItems }
      ] = useField(`${namePrefix}${name}`);

      const error = typeof itemsError === "string" ? itemsError : undefined;
      return (
        <>
          <FormikRadioGroup
            name={`${namePrefix}${name}InputMethod`}
            orientation="horizontal"
            label={label}
            isRequired={isRequired}
          >
            <Radio data-test-id={`${namePrefix}${name}FormOption`} value={FORM}>
              Manually enter {label.toLowerCase()}.
            </Radio>
            <Radio
              data-test-id={`${namePrefix}${name}DataElementOption`}
              value={DATA_ELEMENT}
            >
              Provide a data element.
            </Radio>
          </FormikRadioGroup>
          {inputMethod === FORM && (
            <FieldArray
              name={name}
              render={arrayHelpers => {
                return (
                  <div>
                    <Flex direction="column" gap="size-100" alignItems="start">
                      {items.map((item, index) => {
                        return (
                          <Flex key={index} alignItems="start">
                            <DataElementSelector>
                              <FormikTextField
                                data-test-id={`${namePrefix}${name}${index}Field`}
                                aria-label={`${label} ${index + 1}`}
                                name={`${namePrefix}${name}.${index}`}
                                width="size-5000"
                                marginTop="size-0"
                                description={
                                  index === items.length - 1
                                    ? description
                                    : undefined
                                }
                                error={
                                  index === items.length - 1 ? error : undefined
                                }
                                invalid={error && itemsTouched}
                                touched={itemsTouched}
                              />
                            </DataElementSelector>
                            <ActionButton
                              data-test-id={`${namePrefix}${name}${index}RemoveButton`}
                              isQuiet
                              isDisabled={items.length === 1}
                              variant="secondary"
                              onPress={() => {
                                // using arrayHelpers.remove mangles the error message
                                setItems(items.filter((_, i) => i !== index));
                              }}
                              aria-label={`Remove ${label} ${index + 1}`}
                              marginTop={0}
                            >
                              <Delete />
                            </ActionButton>
                          </Flex>
                        );
                      })}
                    </Flex>
                    <Button
                      variant="secondary"
                      data-test-id={`${namePrefix}${name}AddButton`}
                      onPress={() => arrayHelpers.push("")}
                    >
                      Add {singularLabel.toLowerCase()}
                    </Button>
                  </div>
                );
              }}
            />
          )}
          {inputMethod === DATA_ELEMENT && (
            <DataElementSelector>
              <FormikTextField
                data-test-id={`${namePrefix}${name}DataElementField`}
                name={`${namePrefix}${name}DataElement`}
                description={dataElementDescription}
                width="size-5000"
                aria-label={`${label} data element`}
              />
            </DataElementSelector>
          )}
        </>
      );
    }
  };
  part.Component.propTypes = {
    namePrefix: PropTypes.string
  };
  return part;
}
