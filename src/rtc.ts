type PrimitiveType =
  | "undefined"
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "function";

class Type {
  private oProperties: Map<string, PrimitiveType | Type> = new Map();

  public addProperty(sName: string, vType: PrimitiveType | Type): Type {
    this.oProperties.set(sName, vType);
    return this;
  }

  public removeProperty(sName: string): Type {
    this.oProperties.delete(sName);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public checkType(oObj: Record<string, any>): void {
    const aCheckedProperties: string[] = [];

    for (const sKey in oObj) {
      const vType = this.oProperties.get(sKey);
      const vPropType = typeof oObj[sKey];

      const sErrorMessge = `Property ${sKey} is of type ${vPropType} but has to be of type ${vType}`;

      // Wenn das zu prüfende Objekt mehr Properties hat als der Typ
      // ist es trotzdem noch typkompatibel; einfach weiter machen
      if (!vType) continue;

      // Wenn die Property erwartungsweise einweiterer Typ ist diesen
      // rekursiv prüfen und vorher sicherstellen, das die Proeprty ein
      // Objekt ist
      if (vType instanceof Type) {
        if (vPropType !== "object") throw new Error(sErrorMessge);

        vType.checkType(oObj[sKey]);
        aCheckedProperties.push(sKey);
        continue;
      }

      // Wenn die Property ein Array ist muss sie nicht als auch als
      // deklariert sein, sonst Fehler!
      if (vPropType === "object" && Array.isArray(oObj[sKey])) {
        if (vType !== "array") throw new Error(sErrorMessge);
        aCheckedProperties.push(sKey);
        continue;
      }

      // Wenn die primitiven Typen nicht übereinstimmen ist das Objekt
      // nicht typkompatibel; Fehler!
      if (vPropType !== vType) throw new Error(sErrorMessge);
      aCheckedProperties.push(sKey);
    }

    // Wenn nicht alle Properties des Typs im zu prüfenden Objekt
    // enthalten sind ist das Objekt nicht typkompatibel; Fehler!
    for (const sKey of this.oProperties.keys()) {
      if (!aCheckedProperties.includes(sKey)) throw new Error(`Property ${sKey} is missing`);
    }
  }
}

class RuntimeTypeCheck {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static defineType(oDescription: Record<string, any>): Type {
    const oType = new Type();

    // Typ-Beschreibung durchlaufen und Type-Objekt mit properties befüllen
    for (const sKey in oDescription) {
      let vType = oDescription[sKey];

      // Wenn wir geschachtelte Objekte haben die Typen rekursiv erstellen
      if (typeof vType === "object") vType = RuntimeTypeCheck.defineType(oDescription[sKey]);

      oType.addProperty(sKey, vType);
    }

    return oType;
  }
}

export { RuntimeTypeCheck, Type };
